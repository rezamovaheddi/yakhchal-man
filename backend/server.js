import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// Database storage setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return { users: {}, fridges: {}, logs: [] };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// Basic abuse protection: the AI endpoint costs real Gemini quota, so it gets
// a strict per-IP budget; everything else gets a generous global cap.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  },
});

app.use(globalLimiter);

// Health Check Endpoint (intentionally minimal — no user counts or internals)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'yakhchal-man-ai-backend',
    time: new Date().toISOString(),
  });
});

// Save / Sync User Fridge and Ingredients to Database
app.post('/api/user/fridge', (req, res) => {
  try {
    const { userId, username, fridgeName, inventory = [], antiWasteStats } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'شناسه کاربر الزامی است.',
      });
    }

    const db = loadDatabase();
    db.users = db.users || {};
    db.users[userId] = {
      userId,
      username: username || 'کاربر',
      fridgeName: fridgeName || 'یخچال من',
      inventory,
      antiWasteStats: antiWasteStats || null,
      itemsCount: Array.isArray(inventory) ? inventory.length : 0,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(db);

    console.log(`💾 اطلاعات یخچال کاربر [${username || userId}] با ${db.users[userId].itemsCount} قلم کالا در دیتابیس ثبت شد.`);

    return res.json({
      success: true,
      message: 'اطلاعات یخچال و اقلام در دیتابیس با موفقیت ثبت شد.',
      data: db.users[userId],
    });
  } catch (err) {
    console.error('Database save error:', err);
    return res.status(500).json({
      success: false,
      error: 'خطا در ثبت اطلاعات در دیتابیس.',
    });
  }
});

// Get User Fridge Data from Database
app.get('/api/user/fridge/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = loadDatabase();
    const userData = db.users?.[userId];

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'اطلاعات کاربری در پایگاه داده یافت نشد.',
      });
    }

    return res.json({
      success: true,
      data: userData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'خطا در واکشی اطلاعات از دیتابیس.',
    });
  }
});

// AI Recipe Recommendation Endpoint
app.post('/api/ai/suggest', aiLimiter, async (req, res) => {
  try {
    const { ingredients = [], preferences = '', userId, username, fridgeName } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً حداقل یک ماده غذایی از موجودی یخچال ارسال کنید.',
      });
    }

    // Auto-record / update user fridge and items in database if userId provided
    if (userId) {
      try {
        const db = loadDatabase();
        db.users = db.users || {};
        db.users[userId] = {
          userId,
          username: username || db.users[userId]?.username || 'کاربر',
          fridgeName: fridgeName || db.users[userId]?.fridgeName || 'یخچال من',
          inventory: ingredients,
          itemsCount: ingredients.length,
          lastAiRequest: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveDatabase(db);
        console.log(`💾 اقلام یخچال کاربر [${username || userId}] هنگام درخواست سرآشپز در دیتابیس همگام‌سازی شد.`);
      } catch (e) {
        console.error('Auto sync to db error:', e.message);
      }
    }

    // Prepare ingredient list string
    const itemsDescription = ingredients
      .map((item) => {
        if (typeof item === 'string') return item;
        return `${item.name} (${item.quantity || 1} ${item.unit || 'عدد'})`;
      })
      .join('، ');

    const systemPrompt = `تو یک سرآشپز حرفه‌ای و باهوش ایرانی هستی.
موجودی فعلی یخچال کاربر شامل این مواد است:
[ ${itemsDescription} ]
${preferences ? `ترجیحات کاربر: ${preferences}` : ''}

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
      id: item.id || `ai-${Date.now()}-${index}`,
      title: item.title || `غذای پیشنهادی ${index + 1}`,
      description: item.description || '',
      prepTime: item.prepTime || '۲۵ دقیقه',
      difficulty: item.difficulty || 'آسان',
      category: item.category || 'ناهار و شام',
      iconName: item.iconName || 'stew',
      matchedIngredients: Array.isArray(item.matchedIngredients) ? item.matchedIngredients : [],
      missingIngredients: Array.isArray(item.missingIngredients) ? item.missingIngredients : [],
      instructions: Array.isArray(item.instructions) ? item.instructions : [],
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
});
