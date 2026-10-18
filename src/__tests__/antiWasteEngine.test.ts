import { describe, it, expect } from '@jest/globals';
import {
  getDaysUntilExpiry,
  getFoodExpiryStatus,
  getExpiryBadgeText,
  getUrgentIngredients,
  calculateItemValue,
  rankRecipesWithAntiWastePriority,
  DEFAULT_INGREDIENT_PRICES,
} from '../utils/antiWasteEngine';
import { Ingredient, Recipe } from '../types';

describe('Anti-Waste Engine', () => {
  const refDate = new Date('2026-10-18T12:00:00Z');

  describe('getDaysUntilExpiry & getFoodExpiryStatus', () => {
    it('returns null when expiryDate is missing or invalid', () => {
      expect(getDaysUntilExpiry(undefined, refDate)).toBeNull();
      expect(getDaysUntilExpiry('invalid-date', refDate)).toBeNull();
      expect(getFoodExpiryStatus(undefined, refDate)).toBe('fresh');
    });

    it('identifies item expiring today as 0 days and expiring_soon', () => {
      const today = '2026-10-18';
      expect(getDaysUntilExpiry(today, refDate)).toBe(0);
      expect(getFoodExpiryStatus(today, refDate)).toBe('expiring_soon');
      const badge = getExpiryBadgeText(today, refDate);
      expect(badge.text).toBe('امروز منقضی می‌شود!');
      expect(badge.status).toBe('expiring_soon');
    });

    it('identifies item expiring in 3 days as expiring_soon with correct Persian text', () => {
      const threeDays = '2026-10-21';
      expect(getDaysUntilExpiry(threeDays, refDate)).toBe(3);
      expect(getFoodExpiryStatus(threeDays, refDate)).toBe('expiring_soon');
      const badge = getExpiryBadgeText(threeDays, refDate);
      expect(badge.text).toContain('۳ روز تا انقضا');
    });

    it('identifies item expired 2 days ago as expired', () => {
      const pastDate = '2026-10-16';
      expect(getDaysUntilExpiry(pastDate, refDate)).toBe(-2);
      expect(getFoodExpiryStatus(pastDate, refDate)).toBe('expired');
      const badge = getExpiryBadgeText(pastDate, refDate);
      expect(badge.text).toContain('۲ روز منقضی شده');
    });

    it('identifies item expiring in 10 days as fresh', () => {
      const freshDate = '2026-10-28';
      expect(getDaysUntilExpiry(freshDate, refDate)).toBe(10);
      expect(getFoodExpiryStatus(freshDate, refDate)).toBe('fresh');
      const badge = getExpiryBadgeText(freshDate, refDate);
      expect(badge.text).toContain('۱۰ روز مانده');
    });
  });

  describe('getUrgentIngredients', () => {
    const sampleInventory: Ingredient[] = [
      {
        id: '1',
        name: 'شیر',
        quantity: 1,
        unit: 'لیتر',
        category: 'لبنیات',
        iconName: 'milk',
        expiryDate: '2026-10-20', // in 2 days -> urgent
      },
      {
        id: '2',
        name: 'گوجه‌فرنگی',
        quantity: 3,
        unit: 'عدد',
        category: 'سبزیجات',
        iconName: 'tomato',
        expiryDate: '2026-10-17', // yesterday -> expired
      },
      {
        id: '3',
        name: 'سیب‌زمینی',
        quantity: 4,
        unit: 'عدد',
        category: 'سبزیجات',
        iconName: 'potato',
        expiryDate: '2026-11-05', // 18 days -> fresh
      },
      {
        id: '4',
        name: 'ماست',
        quantity: 0, // 0 quantity -> ignored
        unit: 'بسته',
        category: 'لبنیات',
        iconName: 'cheese',
        expiryDate: '2026-10-19',
      },
    ];

    it('returns only items expiring in <= 3 days or expired, sorted by urgency', () => {
      const urgent = getUrgentIngredients(sampleInventory, refDate);
      expect(urgent.length).toBe(2);
      // Most critical first (yesterday's expired tomato before milk)
      expect(urgent[0].item.name).toBe('گوجه‌فرنگی');
      expect(urgent[0].daysLeft).toBe(-1);
      expect(urgent[0].status).toBe('expired');

      expect(urgent[1].item.name).toBe('شیر');
      expect(urgent[1].daysLeft).toBe(2);
      expect(urgent[1].status).toBe('expiring_soon');
    });
  });

  describe('rankRecipesWithAntiWastePriority', () => {
    const sampleRecipes: Recipe[] = [
      {
        id: 'rec-1',
        title: 'املت گوجه',
        description: 'املت لذیذ',
        prepTime: '۱۵ دقیقه',
        difficulty: 'آسان',
        category: 'صبحانه',
        iconName: 'omelette',
        ingredients: [
          { name: 'گوجه‌فرنگی', requiredQuantity: 2, unit: 'عدد' },
          { name: 'تخم‌مرغ', requiredQuantity: 2, unit: 'عدد' },
        ],
        instructions: [],
      },
      {
        id: 'rec-2',
        title: 'پوره سیب‌زمینی',
        description: 'پوره خوشمزه',
        prepTime: '۱۵ دقیقه',
        difficulty: 'آسان',
        category: 'غذای اصلی',
        iconName: 'potato',
        ingredients: [
          { name: 'سیب‌زمینی', requiredQuantity: 2, unit: 'عدد' },
          { name: 'کره', requiredQuantity: 1, unit: 'بسته' },
        ],
        instructions: [],
      },
    ];

    const sampleInventory: Ingredient[] = [
      {
        id: '1',
        name: 'گوجه‌فرنگی',
        quantity: 2,
        unit: 'عدد',
        category: 'سبزیجات',
        iconName: 'tomato',
        expiryDate: '2026-10-19', // in 1 day! (Urgent)
      },
      {
        id: '2',
        name: 'تخم‌مرغ',
        quantity: 2,
        unit: 'عدد',
        category: 'پروتئین',
        iconName: 'egg',
        expiryDate: '2026-10-30',
      },
      {
        id: '3',
        name: 'سیب‌زمینی',
        quantity: 2,
        unit: 'عدد',
        category: 'سبزیجات',
        iconName: 'potato',
        expiryDate: '2026-11-10', // long shelf-life
      },
      {
        id: '4',
        name: 'کره',
        quantity: 1,
        unit: 'بسته',
        category: 'لبنیات',
        iconName: 'butter',
        expiryDate: '2026-11-10',
      },
    ];

    it('prioritizes recipes that rescue urgent ingredients', () => {
      const ranked = rankRecipesWithAntiWastePriority(sampleRecipes, sampleInventory, refDate);
      expect(ranked[0].recipe.title).toBe('املت گوجه');
      expect(ranked[0].expiringCount).toBe(1);
      expect(ranked[0].antiWasteBonus).toBeGreaterThan(0);
    });
  });

  describe('calculateItemValue', () => {
    it('uses custom estimatedPrice if provided', () => {
      const item: Ingredient = {
        id: '1',
        name: 'شیر محلی',
        quantity: 2,
        unit: 'لیتر',
        category: 'لبنیات',
        iconName: 'milk',
        estimatedPrice: 42000,
      };
      expect(calculateItemValue(item)).toBe(84000);
    });

    it('falls back to DEFAULT_INGREDIENT_PRICES by name', () => {
      const item: Ingredient = {
        id: '2',
        name: 'شیر',
        quantity: 2,
        unit: 'لیتر',
        category: 'لبنیات',
        iconName: 'milk',
      };
      expect(calculateItemValue(item)).toBe(2 * DEFAULT_INGREDIENT_PRICES['شیر']);
    });
  });
});
