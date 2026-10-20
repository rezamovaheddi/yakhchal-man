import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const CLOUDFLARE_TUNNEL_ID = process.env.CLOUDFLARE_TUNNEL_ID || '9d434a06-3486-4303-98dd-479105d6a5d8';

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'yakhchal-man-ai-backend',
    model: GEMINI_MODEL,
    cloudflareTunnelId: CLOUDFLARE_TUNNEL_ID,
    time: new Date().toISOString(),
  });
});

// AI Recipe Recommendation Endpoint
app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { ingredients = [], preferences = '' } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً حداقل یک ماده غذایی از موجودی یخچال ارسال کنید.',
      });
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
      return res.status(response.status).json({
        success: false,
        error: `خطا در دریافت پاسخ از هوش مصنوعی (${response.status})`,
        details: errorText,
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
      details: err?.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 سرور هوش مصنوعی یخچال من روی پورت ${PORT} با مدل ${GEMINI_MODEL} فعال شد.`);
  console.log(`📡 آدرس سلامت: http://localhost:${PORT}/health`);
  console.log(`🍲 اندپوینت پیشنهاد غذا: POST http://localhost:${PORT}/api/ai/suggest`);
  console.log(`🌐 Cloudflare Tunnel ID: ${CLOUDFLARE_TUNNEL_ID}`);
});
