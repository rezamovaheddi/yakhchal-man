import { Ingredient, UserAccount } from '../types';
import { authStorage } from '../utils/authStorage';

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
  source?: 'backend';
  connectedUrl?: string;
  databaseSynced?: boolean;
}

export const PRODUCTION_BACKEND_URL = 'https://yakhchal-man.onrender.com/api/ai/suggest';

/**
 * Returns list of backend endpoints to query.
 * The Render 24/7 cloud server is the only official endpoint; expired
 * Cloudflare quick-tunnels and local dev addresses are no longer hardcoded.
 * EXPO_PUBLIC_BACKEND_URL (from .env) can override for local development.
 */
export const getBackendUrls = (): string[] => {
  const customUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  return [...new Set([PRODUCTION_BACKEND_URL, customUrl].filter(Boolean) as string[])];
};

/**
 * Render free tier needs up to ~60s for a cold start, and Gemini generation
 * itself takes several seconds — 5s timeouts aborted valid requests, so the
 * production endpoint gets a longer window and one retry (which also spins
 * the instance up).
 */
const AI_REQUEST_TIMEOUT_MS = 20000;
const SYNC_REQUEST_TIMEOUT_MS = 8000;

/**
 * Cloud-sync credentials (fixes BOLA/IDOR on the backend).
 * The device generates a 256-bit syncSecret per profile; requests carry
 * `Authorization: Bearer <userId>:<syncSecret>`. The backend stores only a
 * SHA-256 of that pair, so nobody can read or overwrite another user's fridge
 * by guessing userIds. Registration is deduplicated per process.
 */
let registrationInFlight: Promise<void> | null = null;

function backendUrlFor(baseEndpoint: string, path: '/api/auth/register' | '/api/user/fridge'): string {
  return baseEndpoint.replace(/\/api\/ai\/suggest$/, path);
}

async function ensureServerRegistration(user: UserAccount): Promise<void> {
  if (!registrationInFlight) {
    registrationInFlight = (async () => {
      for (const baseEndpoint of getBackendUrls()) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
          await fetch(backendUrlFor(baseEndpoint, '/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              syncSecret: user.syncSecret,
              username: user.username,
              name: user.name,
              passwordHash: user.password,
              avatar: user.avatar,
            }),
            signal: controller.signal,
          });
          // 200 (registered) or 409 (already known) both mean the credential
          // pair is usable — stop here.
          return;
        } catch {
          // try next url
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
    })().finally(() => {
      // Allow a retry on the next sync attempt after failures settle.
      registrationInFlight = null;
    });
  }
  return registrationInFlight;
}

/**
 * Synchronize user's fridge and items into backend database
 */
export async function syncFridgeToDatabase(
  user: UserAccount,
  fridgeName: string,
  inventory: Ingredient[],
  antiWasteStats?: any
): Promise<{ success: boolean; message?: string }> {
  const authedUser = await authStorage.ensureSyncSecret(user);
  if (!authedUser.syncSecret) {
    return { success: false, message: 'کلید همگام‌سازی در دسترس نیست.' };
  }

  await ensureServerRegistration(authedUser);

  const backendUrls = getBackendUrls();
  const payload = {
    name: authedUser.name,
    username: authedUser.username,
    passwordHash: authedUser.password,
    avatar: authedUser.avatar,
    fridgeName,
    inventory,
    antiWasteStats,
  };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authedUser.id}:${authedUser.syncSecret}`,
  };

  for (const baseEndpoint of backendUrls) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);

      const res = await fetch(backendUrlFor(baseEndpoint, '/api/user/fridge'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.ok) {
        return { success: true, message: 'اطلاعات در دیتابیس ثبت شد.' };
      }
    } catch {
      // try next url
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return { success: false, message: 'امکان اتصال به سرور جهت ذخیره در دیتابیس مهیا نشد.' };
}

/**
 * Fetch 3 AI recipe suggestions using the ingredients currently in the user's fridge.
 * All AI traffic goes through the dedicated backend server — the old direct
 * Gemini fallback is removed on purpose: an EXPO_PUBLIC_* API key would be
 * embedded in the shipped APK and extractable by anyone.
 */
export async function getAiRecipeSuggestions(
  ingredients: Ingredient[],
  preferences?: string,
  user?: UserAccount | null,
  fridgeName?: string
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
    username: user?.name,
    fridgeName,
  };

  // Authenticated requests let the backend attribute the fridge sync to the
  // proven identity instead of a client-supplied userId.
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) {
    try {
      const authedUser = await authStorage.ensureSyncSecret(user);
      if (authedUser.syncSecret) {
        await ensureServerRegistration(authedUser);
        headers = {
          ...headers,
          Authorization: `Bearer ${authedUser.id}:${authedUser.syncSecret}`,
        };
      }
    } catch {
      // Sync credentials unavailable — proceed without the header; the AI
      // endpoint stays usable for guests and the sync is best-effort.
    }
  }

  // Try dedicated Backend Server (Render cloud, with retry for cold starts)
  const backendUrls = getBackendUrls();
  for (const url of backendUrls) {
    const attempts = url === PRODUCTION_BACKEND_URL ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.suggestions)) {
            return {
              success: true,
              suggestions: data.suggestions,
              source: 'backend' as const,
              connectedUrl: url,
            };
          }
        }
      } catch {
        // Backend not running on this URL or unreachable, retry or fallback
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }
  }

  return {
    success: false,
    error: 'ارتباط با سرور بک‌اند برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید.',
  };
}
