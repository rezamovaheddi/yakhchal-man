import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { getAiRecipeSuggestions, syncFridgeToDatabase } from '../services/aiRecipeService';
import { Ingredient } from '../types';

describe('aiRecipeService', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  const sampleIngredients: Ingredient[] = [
    {
      id: 'ing-1',
      name: 'تخم‌مرغ',
      category: 'پروتئین',
      quantity: 4,
      unit: 'عدد',
      iconName: 'egg',
      expiryDate: '2026-10-30',
      storageLocation: 'یخچال',
    },
    {
      id: 'ing-2',
      name: 'گوجه‌فرنگی',
      category: 'سبزیجات',
      quantity: 3,
      unit: 'عدد',
      iconName: 'tomato',
      expiryDate: '2026-10-22',
      storageLocation: 'یخچال',
    },
  ];

  it('should return error if inventory is empty', async () => {
    const res = await getAiRecipeSuggestions([]);
    expect(res.success).toBe(false);
    expect(res.error).toContain('یخچال شما خالی است');
  });

  it('should fetch recipes from backend when server responds ok', async () => {
    const mockSuggestions = [
      {
        id: 'ai-recipe-1',
        title: 'املت گوجه‌فرنگی سنتی',
        description: 'یک املت لذیذ و سریع با گوجه و تخم‌مرغ تازه',
        prepTime: '۱۵ دقیقه',
        difficulty: 'آسان',
        category: 'صبحانه / شام',
        iconName: 'egg',
        matchedIngredients: ['تخم‌مرغ', 'گوجه‌فرنگی'],
        missingIngredients: ['نمک', 'روغن'],
        instructions: ['گوجه را خرد کرده و تفت دهید.', 'تخم‌مرغ‌ها را اضافه کنید.'],
      },
      {
        id: 'ai-recipe-2',
        title: 'نیمرو با گوجه کبابی',
        description: 'نیمروی خوش‌طعم در کنار گوجه',
        prepTime: '۱۰ دقیقه',
        difficulty: 'آسان',
        category: 'صبحانه',
        iconName: 'egg',
        matchedIngredients: ['تخم‌مرغ', 'گوجه‌فرنگی'],
        missingIngredients: [],
        instructions: ['گوجه را تفت دهید.', 'تخم‌مرغ را اضافه کرده و بپزید.'],
      },
      {
        id: 'ai-recipe-3',
        title: 'کوکوی گوجه فرنگی',
        description: 'کوکوی ساده و سالم خانگی',
        prepTime: '۲۰ دقیقه',
        difficulty: 'متوسط',
        category: 'شام',
        iconName: 'egg',
        matchedIngredients: ['تخم‌مرغ', 'گوجه‌فرنگی'],
        missingIngredients: ['آرد'],
        instructions: ['مواد را میکس کرده و در روغن سرخ کنید.'],
      },
    ];

    (globalThis as any).fetch = (jest.fn() as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        suggestions: mockSuggestions,
      }),
    });

    const res = await getAiRecipeSuggestions(sampleIngredients);
    expect(res.success).toBe(true);
    expect(res.suggestions).toHaveLength(3);
    expect(res.suggestions?.[0].title).toBe('املت گوجه‌فرنگی سنتی');
    expect(res.source).toBe('backend');
  });

  it('should return an error when the backend is unreachable (no client-side Gemini key)', async () => {
    // All backend URLs fail — the old direct-Gemini fallback was removed
    // because EXPO_PUBLIC_* keys get embedded in the shipped APK.
    (globalThis as any).fetch = jest.fn(() => Promise.reject(new Error('Connection refused')));

    const res = await getAiRecipeSuggestions(sampleIngredients);
    expect(res.success).toBe(false);
    expect(res.error).toContain('ارتباط با سرور بک‌اند برقرار نشد');
  });

  it('should send the sync Authorization header with userId and syncSecret', async () => {
    const fetchCalls: { url: string; init: any }[] = [];
    (globalThis as any).fetch = jest.fn((url: any, init: any) => {
      fetchCalls.push({ url: String(url), init });
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'ثبت شد' }),
      });
    });

    const mockUser = {
      id: 'usr-0123456789abcdef',
      name: 'رضا',
      username: 'reza',
      password: '123',
      avatar: 'chef',
      createdAt: '2026-10-20',
      syncSecret: 'a'.repeat(64),
    };

    const res = await syncFridgeToDatabase(mockUser, 'یخچال من', sampleIngredients);
    expect(res.success).toBe(true);

    const authCalls = fetchCalls.filter((c) => c.init.headers?.Authorization);
    expect(authCalls.length).toBeGreaterThan(0);
    expect(authCalls[0].init.headers.Authorization).toBe(
      `Bearer usr-0123456789abcdef:${'a'.repeat(64)}`
    );
    // The payload must NOT carry a client-controlled userId anymore — the
    // backend derives identity from the verified Bearer token.
    expect(authCalls[0].init.body).not.toContain('usr-0123456789abcdef');
  });
});
