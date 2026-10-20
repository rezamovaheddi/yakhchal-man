import { Ingredient } from '../types';

export interface AiRecipeSuggestion {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  difficulty: string;
  category: string;
  iconName: string;
  matchedIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
}

export interface AiRecipeResponse {
  success: boolean;
  suggestions?: AiRecipeSuggestion[];
  error?: string;
  source?: 'backend' | 'direct_gemini';
}

export const CLOUDFLARE_TUNNEL_ID = '9d434a06-3486-4303-98dd-479105d6a5d8';
export const LIVE_CLOUDFLARE_URL = 'https://upon-ideal-compound-seating.trycloudflare.com/api/ai/suggest';

// Backend URLs to try in priority order:
// 1. Localhost for fast local response (if running on same machine)
// 2. Custom domain or backend URL if configured in environment
// 3. Live Cloudflare Tunnel public endpoint (allows mobile APK to connect from anywhere on 4G/WiFi)
// 4. Cloudflare Argo tunnel endpoint
// 5. Android Emulator host (10.0.2.2)
const BACKEND_URLS = [
  'http://localhost:3001/api/ai/suggest',
  process.env.EXPO_PUBLIC_BACKEND_URL,
  LIVE_CLOUDFLARE_URL,
  `https://${CLOUDFLARE_TUNNEL_ID}.cfargotunnel.com/api/ai/suggest`,
  'http://10.0.2.2:3001/api/ai/suggest',
].filter(Boolean) as string[];

// Direct fallback configuration (loaded from environment variable if configured)
const DIRECT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const DIRECT_GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Fetch 3 AI recipe suggestions using the ingredients currently in the user's fridge.
 * First attempts to query the dedicated backend server (port 3001).
 * If the local server is offline or unreachable from the device network,
 * it seamlessly falls back to the direct Gemini API using the provided key.
 */
export async function getAiRecipeSuggestions(
  ingredients: Ingredient[],
  preferences?: string,
  directApiKey?: string
): Promise<AiRecipeResponse> {
  if (!ingredients || ingredients.length === 0) {
    return {
      success: false,
      error: 'یخچال شما خالی است! لطفاً ابتدا چند قلم کالا به یخچال اضافه کنید.',
    };
  }

  const payload = {
    ingredients: ingredients.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      storageLocation: item.storageLocation,
    })),
    preferences,
  };

  // 1. Try dedicated Backend Server
  for (const url of BACKEND_URLS) {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          return {
            success: true,
            suggestions: data.suggestions,
            source: 'backend',
          };
        }
      }
    } catch {
      // Backend not running on this URL or unreachable, try next or fallback
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  // 2. Direct Gemini Fallback (if backend is offline or on a remote device)
  const activeKey = directApiKey || DIRECT_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (!activeKey) {
    return {
      success: false,
      error: 'ارتباط با سرور بک‌اند برقرار نشد. لطفاً سرور بک‌اند را روشن کنید.',
    };
  }

  try {
    const itemsDescription = ingredients
      .map((item) => `${item.name} (${item.quantity} ${item.unit})`)
      .join('، ');

    const prompt = `تو یک سرآشپز حرفه‌ای و باهوش ایرانی هستی.
موجودی فعلی یخچال کاربر شامل این مواد است:
[ ${itemsDescription} ]
${preferences ? `ترجیحات کاربر: ${preferences}` : ''}

وظیفه تو این است که بر اساس این مواد، دقیقاً ۳ پیشنهاد غذای مناسب، لذیذ و عملی (ترجیحاً غذاهای محبوب و رایج ایرانی یا بین‌المللی متناسب با ذائقه ایرانی) ارائه کنی.

خروجی باید صرفاً یک آرایه معتبر JSON شامل ۳ شیء با ساختار زیر باشد:
[
  {
    "id": "ai-1",
    "title": "نام غذا (فارسی)",
    "description": "توضیح کوتاه و جذاب",
    "prepTime": "مثلاً ۲۰ دقیقه",
    "difficulty": "آسان یا متوسط یا سخت",
    "category": "صبحانه / ناهار و شام / خوراک و نونی / اقتصادی",
    "iconName": "یک نام از: egg, tomato, potato, cheese, milk, onion, garlic, carrot, mushroom, chicken, butter, bread, fish, meat, rice, stew, soup, herb",
    "matchedIngredients": ["مواد استفاده شده از یخچال"],
    "missingIngredients": ["مواد کمبوددار در صورت وجود"],
    "instructions": [
      "مرحله اول پخت",
      "مرحله دوم پخت",
      "مرحله سوم پخت"
    ]
  }
]
فقط آرایه JSON معتبر برگردان.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${DIRECT_GEMINI_MODEL}:generateContent?key=${activeKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `خطا در برقراری ارتباط با مدل هوش مصنوعی (${response.status})`,
      };
    }

    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { success: false, error: 'پاسخی از هوش مصنوعی دریافت نشد.' };
    }

    let parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) {
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        parsed = parsed.suggestions;
      } else if (parsed.recipes && Array.isArray(parsed.recipes)) {
        parsed = parsed.recipes;
      } else {
        parsed = [parsed];
      }
    }

    const sanitized: AiRecipeSuggestion[] = parsed.slice(0, 3).map((item: any, idx: number) => ({
      id: item.id || `ai-${Date.now()}-${idx}`,
      title: item.title || `غذای پیشنهادی ${idx + 1}`,
      description: item.description || '',
      prepTime: item.prepTime || '۲۵ دقیقه',
      difficulty: item.difficulty || 'آسان',
      category: item.category || 'ناهار و شام',
      iconName: item.iconName || 'stew',
      matchedIngredients: Array.isArray(item.matchedIngredients) ? item.matchedIngredients : [],
      missingIngredients: Array.isArray(item.missingIngredients) ? item.missingIngredients : [],
      instructions: Array.isArray(item.instructions) ? item.instructions : [],
    }));

    return {
      success: true,
      suggestions: sanitized,
      source: 'direct_gemini',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'خطا در ارتباط با سرور هوش مصنوعی.',
    };
  }
}
