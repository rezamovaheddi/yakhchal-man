import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { getAiRecipeSuggestions } from '../services/aiRecipeService';
import { Ingredient } from '../types';

describe('aiRecipeService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
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

    (global as any).fetch = (jest.fn() as any).mockResolvedValueOnce({
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

  it('should fall back to direct gemini if backend fails', async () => {
    const mockGeminiJson = JSON.stringify({
      recipes: [
        {
          title: 'املت گوجه فرنگی رستورانی',
          description: 'صبحانه اصیل ایرانی',
          prepTime: '۱۵ دقیقه',
          difficulty: 'آسان',
          category: 'صبحانه',
          iconName: 'egg',
          matchedIngredients: ['تخم‌مرغ', 'گوجه‌فرنگی'],
          missingIngredients: ['روغن'],
          instructions: ['گوجه را بپزید', 'تخم مرغ را بزنید'],
        },
      ],
    });

    (global as any).fetch = jest.fn((url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: mockGeminiJson }],
                },
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Connection refused'));
    });

    const res = await getAiRecipeSuggestions(sampleIngredients, undefined, 'test-gemini-key');
    expect(res.success).toBe(true);
    expect(res.source).toBe('direct_gemini');
    expect(res.suggestions).toHaveLength(1);
    expect(res.suggestions?.[0].title).toBe('املت گوجه فرنگی رستورانی');
  });
});
