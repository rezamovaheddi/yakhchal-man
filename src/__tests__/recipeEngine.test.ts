import { describe, test, expect } from '@jest/globals';
import { toPersianDigits, formatQuantity } from '../utils/persian';
import { checkRecipeAvailability, rankRecipesByAvailability } from '../utils/recipeEngine';
import { Ingredient, Recipe } from '../types';

describe('Persian Helpers', () => {
  test('converts numbers to Persian numerals properly', () => {
    expect(toPersianDigits(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(toPersianDigits(4)).toBe('۴');
    expect(toPersianDigits(0)).toBe('۰');
  });

  test('formats quantity with unit', () => {
    expect(formatQuantity(4, 'عدد')).toBe('۴ عدد');
    expect(formatQuantity(1, 'بسته')).toBe('۱ بسته');
  });
});

describe('Recipe Engine', () => {
  const mockInventory: Ingredient[] = [
    { id: '1', name: 'تخم‌مرغ', quantity: 4, unit: 'عدد', category: 'پروتئین', iconName: 'egg' },
    { id: '2', name: 'گوجه‌فرنگی', quantity: 3, unit: 'عدد', category: 'سبزیجات', iconName: 'tomato' },
    { id: '3', name: 'سیب‌زمینی', quantity: 2, unit: 'عدد', category: 'سبزیجات', iconName: 'potato' },
  ];

  const omelette: Recipe = {
    id: 'r1',
    title: 'املت گوجه‌فرنگی',
    description: 'یه غذای خوشمزه با مواد ساده‌ی داخل یخچالت!',
    prepTime: '۱۵ دقیقه',
    difficulty: 'آسان',
    category: 'صبحانه و عصرانه',
    iconName: 'omelette',
    ingredients: [
      { name: 'تخم‌مرغ', requiredQuantity: 2, unit: 'عدد' },
      { name: 'گوجه‌فرنگی', requiredQuantity: 2, unit: 'عدد' },
    ],
    instructions: ['گوجه‌ها را خرد کنید', 'تخم‌مرغ‌ها را اضافه کنید'],
  };

  const kookoo: Recipe = {
    id: 'r2',
    title: 'کوکو سبزی',
    description: 'کوکوی معطر و سنتی',
    prepTime: '۳۰ دقیقه',
    difficulty: 'متوسط',
    category: 'غذای سنتی',
    iconName: 'dish',
    ingredients: [
      { name: 'تخم‌مرغ', requiredQuantity: 3, unit: 'عدد' },
      { name: 'سبزی کوکو', requiredQuantity: 1, unit: 'بسته' },
      { name: 'گردو', requiredQuantity: 1, unit: 'بسته' },
    ],
    instructions: ['سبزی را مخلوط کنید'],
  };

  test('detects fully available recipe', () => {
    const result = checkRecipeAvailability(omelette, mockInventory);
    expect(result.isFullyAvailable).toBe(true);
    expect(result.availableCount).toBe(2);
    expect(result.totalRequired).toBe(2);
    expect(result.percentage).toBe(100);
    expect(result.missingIngredients.length).toBe(0);
  });

  test('detects partially available recipe and missing ingredients', () => {
    const result = checkRecipeAvailability(kookoo, mockInventory);
    expect(result.isFullyAvailable).toBe(false);
    expect(result.availableCount).toBe(1); // تخم‌مرغ is available
    expect(result.totalRequired).toBe(3);
    expect(result.missingIngredients).toContain('سبزی کوکو');
    expect(result.missingIngredients).toContain('گردو');
  });

  test('correctly ranks recipes by cookability percentage', () => {
    const ranked = rankRecipesByAvailability([kookoo, omelette], mockInventory);
    expect(ranked[0].recipe.id).toBe('r1'); // omelette 100%
    expect(ranked[1].recipe.id).toBe('r2'); // kookoo 33%
  });

  test('successfully processes newly added recipes with selected items', () => {
    const selectedItems: Ingredient[] = [
      { id: '1', name: 'تخم‌مرغ', quantity: 2, unit: 'عدد', category: 'پروتئین', iconName: 'egg' },
      { id: '2', name: 'نان', quantity: 2, unit: 'عدد', category: 'سایر', iconName: 'bread' },
      { id: '3', name: 'شیر', quantity: 1, unit: 'لیتر', category: 'لبنیات', iconName: 'milk' },
    ];

    const frenchToast: Recipe = {
      id: 'rec-10',
      title: 'تست فرانسوی طلایی',
      description: 'صبحانه‌ای لوکس و نوستالژیک',
      prepTime: '۱۰ دقیقه',
      difficulty: 'آسان',
      category: 'صبحانه و عصرانه',
      iconName: 'bread',
      ingredients: [
        { name: 'نان', requiredQuantity: 2, unit: 'عدد' },
        { name: 'تخم‌مرغ', requiredQuantity: 2, unit: 'عدد' },
        { name: 'شیر', requiredQuantity: 1, unit: 'لیتر' },
      ],
      instructions: ['تخم‌مرغ و شیر را هم بزنید'],
    };

    const result = checkRecipeAvailability(frenchToast, selectedItems);
    expect(result.isFullyAvailable).toBe(true);
    expect(result.percentage).toBe(100);
    expect(result.missingIngredients.length).toBe(0);
  });
});
