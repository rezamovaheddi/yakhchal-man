import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// The service runs behind Render's proxy / Cloudflare, so the client IP is in
// X-Forwarded-For. Without this, express-rate-limit buckets EVERY user under
// the proxy IP and one person can exhaust the budget for everyone.
app.set('trust proxy', 1);

// Rate limits are env-configurable; DISABLE_RATE_LIMIT=1 exists purely for
// local load testing (backend/loadtest.mjs) — never enable it in production.
const RATE_LIMITS_DISABLED = process.env.DISABLE_RATE_LIMIT === '1';
const GLOBAL_MAX = parseInt(process.env.RATE_LIMIT_GLOBAL || '120', 10);
const AI_MAX = parseInt(process.env.RATE_LIMIT_AI || '10', 10);

function makeLimiter(max, message) {
  if (RATE_LIMITS_DISABLED) {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: message },
  });
}

const globalLimiter = makeLimiter(
  GLOBAL_MAX,
  'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.'
);
const aiLimiter = makeLimiter(
  AI_MAX,
  'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.'
);

// ---------------------------------------------------------------------------
// Database layer — in-memory cache with debounced atomic persistence
// ---------------------------------------------------------------------------
// The JSON file is loaded ONCE at boot; every request reads from memory.
// Writes mutate the cache immediately and schedule a single debounced flush,
// so 100 concurrent users do not trigger 100 synchronous full-file rewrites.
// Persistence is atomic (tmp file + rename) so a crash mid-write can never
// corrupt the previous snapshot.

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Object.create(null) → no prototype inheritance, so a userId of "toString"
// or "__proto__" can never shadow Object.prototype members.
function createDb() {
  const db = Object.create(null);
  db.users = Object.create(null);
  db.credentials = Object.create(null);
  db.logs = [];
  return db;
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      parsed.users = Object.assign(Object.create(null), parsed.users);
      parsed.credentials = Object.assign(Object.create(null), parsed.credentials || {});
      parsed.logs = parsed.logs || [];
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return createDb();
}

const db = loadDatabase();

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(db), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }, 500);
}

function hasOwn(map, key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);
}

// ---------------------------------------------------------------------------
// Credential verification (fixes BOLA/IDOR)
// ---------------------------------------------------------------------------
// Fridge endpoints require `Authorization: Bearer <userId>:<syncSecret>`.
// The server stores only SHA-256(userId:syncSecret), compares with
// timingSafeEqual, and rejects any body/param userId that differs from the
// authenticated one. syncSecret is a 256-bit random value generated on the
// device — unguessable, unlike the old usr-<timestamp> ids.

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf-8').digest('hex');
}

function authenticate(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer ([A-Za-z0-9-]+):([0-9a-fA-F]{64})$/.exec(header);
  if (!match) return null;
  const [userId, secret] = [match[1], match[2]];

  if (!hasOwn(db.credentials, userId)) return null;

  const presented = Buffer.from(sha256Hex(`${userId}:${secret.toLowerCase()}`), 'hex');
  const stored = Buffer.from(db.credentials[userId], 'hex');
  if (presented.length !== stored.length || !crypto.timingSafeEqual(presented, stored)) {
    return null;
  }
  return userId;
}

// ---------------------------------------------------------------------------
// Input validation / sanitisation (fixes prompt injection + oversize abuse)
// ---------------------------------------------------------------------------

const MAX_INVENTORY_ITEMS = 50;
const MAX_STRING_FIELDS = { name: 60, unit: 24, preferences: 200, username: 60, fridgeName: 60 };

// Strips control characters and prompt-structure brackets from any text that
// will be interpolated into the Gemini prompt.
function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[[\]{}]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeInventory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_INVENTORY_ITEMS).map((item) => {
    if (typeof item === 'string') return sanitizeText(item, MAX_STRING_FIELDS.name);
    return {
      name: sanitizeText(item?.name, MAX_STRING_FIELDS.name) || 'ماده',
      quantity: Math.min(9999, Math.max(0, Number(item?.quantity) || 1)),
      unit: sanitizeText(item?.unit, MAX_STRING_FIELDS.unit) || 'عدد',
    };
  });
}

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.use(globalLimiter);

// Health Check Endpoint (intentionally minimal — no user counts or internals)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'yakhchal-man-ai-backend',
    uptimeSec: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1e6),
    time: new Date().toISOString(),
  });
});

// ── Account registration (pairs a userId with its device-generated secret) ──
app.post('/api/auth/register', (req, res) => {
  const { userId, syncSecret, username, fridgeName } = req.body || {};

  if (typeof userId !== 'string' || !/^usr-[0-9a-fA-F-]{8,48}$/.test(userId)) {
    return res.status(400).json({ success: false, error: 'شناسه کاربر نامعتبر است.' });
  }
  if (typeof syncSecret !== 'string' || !/^[0-9a-fA-F]{64}$/.test(syncSecret)) {
    return res.status(400).json({ success: false, error: 'کلید همگام‌سازی نامعتبر است.' });
  }
  if (hasOwn(db.credentials, userId)) {
    return res.status(409).json({ success: false, error: 'این حساب قبلاً روی سرور ثبت شده است.' });
  }

  db.credentials[userId] = sha256Hex(`${userId}:${syncSecret.toLowerCase()}`);
  scheduleSave();

  console.log(`🔑 حساب سرآشپز برای [${sanitizeText(username, 40) || userId}] ثبت شد.`);
  return res.json({ success: true, message: 'حساب همگام‌سازی با موفقیت ثبت شد.' });
});

// Save / Sync User Fridge and Ingredients to Database (auth required)
app.post('/api/user/fridge', (req, res) => {
  const authUserId = authenticate(req);
  if (!authUserId) {
    return res.status(401).json({ success: false, error: 'احراز هویت نامعتبر است.' });
  }

  try {
    const { username, fridgeName, inventory = [], antiWasteStats } = req.body || {};
    const safeInventory = sanitizeInventory(inventory);

    db.users[authUserId] = {
      userId: authUserId,
      username: sanitizeText(username, MAX_STRING_FIELDS.username) || 'کاربر',
      fridgeName: sanitizeText(fridgeName, MAX_STRING_FIELDS.fridgeName) || 'یخچال من',
      inventory: safeInventory,
      antiWasteStats: antiWasteStats && typeof antiWasteStats === 'object' ? antiWasteStats : null,
      itemsCount: safeInventory.length,
      updatedAt: new Date().toISOString(),
    };
    scheduleSave();

    return res.json({
      success: true,
      message: 'اطلاعات یخچال و اقلام در دیتابیس با موفقیت ثبت شد.',
      data: db.users[authUserId],
    });
  } catch (err) {
    console.error('Database save error:', err);
    return res.status(500).json({ success: false, error: 'خطا در ثبت اطلاعات در دیتابیس.' });
  }
});

// Get User Fridge Data from Database (auth required, own data only)
app.get('/api/user/fridge/:userId', (req, res) => {
  const authUserId = authenticate(req);
  if (!authUserId) {
    return res.status(401).json({ success: false, error: 'احراز هویت نامعتبر است.' });
  }
  if (req.params.userId !== authUserId) {
    return res.status(403).json({ success: false, error: 'دسترسی به اطلاعات کاربران دیگر مجاز نیست.' });
  }

  if (!hasOwn(db.users, authUserId)) {
    return res.status(404).json({ success: false, error: 'اطلاعات کاربری در پایگاه داده یافت نشد.' });
  }
  return res.json({ success: true, data: db.users[authUserId] });
});

// AI Recipe Recommendation Endpoint
app.post('/api/ai/suggest', aiLimiter, async (req, res) => {
  try {
    const { ingredients = [], preferences = '', username, fridgeName } = req.body || {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً حداقل یک ماده غذایی از موجودی یخچال ارسال کنید.',
      });
    }

    const safeIngredients = sanitizeInventory(ingredients);
    const safePreferences = sanitizeText(preferences, MAX_STRING_FIELDS.preferences);

    // Auto-record the fridge in the database — only for authenticated users,
    // and only under the identity proven by the Bearer token.
    const authUserId = authenticate(req);
    if (authUserId) {
      try {
        db.users[authUserId] = {
          userId: authUserId,
          username: sanitizeText(username, MAX_STRING_FIELDS.username) || db.users[authUserId]?.username || 'کاربر',
          fridgeName: sanitizeText(fridgeName, MAX_STRING_FIELDS.fridgeName) || db.users[authUserId]?.fridgeName || 'یخچال من',
          inventory: safeIngredients,
          itemsCount: safeIngredients.length,
          lastAiRequest: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        scheduleSave();
      } catch (e) {
        console.error('Auto sync to db error:', e.message);
      }
    }

    // Prepare ingredient list string (already sanitised + capped)
    const itemsDescription = safeIngredients
      .map((item) => {
        if (typeof item === 'string') return item;
        return `${item.name} (${item.quantity} ${item.unit})`;
      })
      .join('، ');

    const systemPrompt = `تو یک سرآشپز حرفه‌ای و باهوش ایرانی هستی.
موجودی فعلی یخچال کاربر شامل این مواد است:
[ ${itemsDescription} ]
${safePreferences ? `ترجیحات کاربر: ${safePreferences}` : ''}

وظیفه تو این است که دقیقاً ۳ پیشنهاد غذای مناسب، لذیذ و عملی (ترجیحاً غذاهای محبوب و رایج ایرانی یا بین‌المللی متناسب با ذائقه ایرانی) ارائه کنی که بیشترین هم‌پوشانی را با مواد موجود در یخچال داشته باشند.

خروجی باید صرفاً یک آرایه معتبر JSON شامل ۳ شیء با ساختار زیر باشد:
[
  {
    "id": "ai-1",
    "title": "نام غذا (فارسی)",
    "description": "توضیح کوتاه و جذاب در یک الی دو جمله",
    "prepTime": "مثلاً ۲۰ دقیقه",
    "difficulty": "آسان یا متوسط یا سخت",
    "category": "صبحانه / ناهار و شام / خوراک و نونی / اقتصادی",
    "iconName": "یک نام انگلیسی مرتبط از قبیل: egg, tomato, potato, cheese, milk, onion, garlic, carrot, mushroom, chicken, butter, bread, fish, meat, rice, stew, soup, herb",
    "matchedIngredients": ["نام موادی که از یخچال استفاده شده است"],
    "missingIngredients": ["مواد اندکی که احیاناً کم است و کاربر باید تهیه کند، یا خالی اگر همه موجود است"],
    "instructions": [
      "مرحله اول دستور پخت به زبان ساده و روان فارسی",
      "مرحله دوم دستور پخت",
      "مرحله سوم دستور پخت"
    ]
  }
]
هیچ متن اضافه‌ای خارج از آرایه JSON ارسال نکن.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini API Error]:', response.status, errorText);
      return res.status(502).json({
        success: false,
        error: `خطا در دریافت پاسخ از هوش مصنوعی (${response.status})`,
      });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: 'پاسخی از مدل هوش مصنوعی دریافت نشد.',
      });
    }

    let parsedSuggestions;
    try {
      parsedSuggestions = JSON.parse(rawText);
      // Ensure it is an array
      if (!Array.isArray(parsedSuggestions)) {
        if (parsedSuggestions.suggestions && Array.isArray(parsedSuggestions.suggestions)) {
          parsedSuggestions = parsedSuggestions.suggestions;
        } else {
          parsedSuggestions = [parsedSuggestions];
        }
      }
    } catch (parseErr) {
      console.error('[JSON Parse Error]:', parseErr, rawText);
      return res.status(500).json({
        success: false,
        error: 'خطا در قالب‌بندی داده‌های دریافتی از مدل.',
      });
    }

    // Add unique IDs if missing
    parsedSuggestions = parsedSuggestions.slice(0, 3).map((item, index) => ({
      id: sanitizeText(item?.id, 48) || `ai-${Date.now()}-${index}`,
      title: sanitizeText(item?.title, 80) || `غذای پیشنهادی ${index + 1}`,
      description: sanitizeText(item?.description, 300),
      prepTime: sanitizeText(item?.prepTime, 32) || '۲۵ دقیقه',
      difficulty: sanitizeText(item?.difficulty, 16) || 'آسان',
      category: sanitizeText(item?.category, 32) || 'ناهار و شام',
      iconName: sanitizeText(item?.iconName, 32) || 'stew',
      matchedIngredients: Array.isArray(item?.matchedIngredients)
        ? item.matchedIngredients.slice(0, 30).map((v) => sanitizeText(v, 60)).filter(Boolean)
        : [],
      missingIngredients: Array.isArray(item?.missingIngredients)
        ? item.missingIngredients.slice(0, 30).map((v) => sanitizeText(v, 60)).filter(Boolean)
        : [],
      instructions: Array.isArray(item?.instructions)
        ? item.instructions.slice(0, 12).map((v) => sanitizeText(v, 500)).filter(Boolean)
        : [],
    }));

    return res.json({
      success: true,
      model: GEMINI_MODEL,
      count: parsedSuggestions.length,
      suggestions: parsedSuggestions,
    });
  } catch (err) {
    console.error('[Server Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'خطای پیش‌بینی‌نشده در سرور بک‌اند.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 سرور هوش مصنوعی یخچال من روی پورت ${PORT} با مدل ${GEMINI_MODEL} فعال شد.`);
  console.log(`📡 آدرس سلامت: http://localhost:${PORT}/health`);
  console.log(`🍲 اندپوینت پیشنهاد غذا: POST http://localhost:${PORT}/api/ai/suggest`);
  if (RATE_LIMITS_DISABLED) {
    console.warn('⚠️ DISABLE_RATE_LIMIT=1 is set — rate limits are OFF. For local load testing only!');
  }
});
