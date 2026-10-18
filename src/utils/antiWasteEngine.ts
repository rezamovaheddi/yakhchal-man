import { FoodExpiryStatus, Ingredient, Recipe } from '../types';
import { toPersianDigits } from './persian';
import { checkRecipeAvailability, compositeScore } from './recipeEngine';

// Default prices in Tomans per unit for common ingredients
export const DEFAULT_INGREDIENT_PRICES: Record<string, number> = {
  'شیر': 38000,
  'پنیر': 65000,
  'تخم‌مرغ': 6000,
  'گوجه‌فرنگی': 25000,
  'سیب‌زمینی': 20000,
  'پیاز': 22000,
  'سیر': 15000,
  'هویج': 18000,
  'قارچ': 75000,
  'مرغ و گوشت': 190000,
  'کره': 45000,
  'نان': 10000,
};

/**
 * Calculates days remaining until expiration relative to a reference date (defaults to today).
 * Positive number: days remaining (e.g. 3)
 * 0: expires today
 * Negative number: already expired (e.g. -2)
 */
export function getDaysUntilExpiry(expiryDateStr?: string, referenceDate: Date = new Date()): number | null {
  if (!expiryDateStr) return null;
  const target = new Date(expiryDateStr);
  if (isNaN(target.getTime())) return null;

  // Clear times to compare days accurately
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = targetMidnight.getTime() - refMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Helper to produce a future ISO date string (YYYY-MM-DD) by adding days to today.
 */
export function getFutureDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/**
 * Determines expiry status:
 * - 'expired': days < 0
 * - 'expiring_soon': 0 <= days <= 3
 * - 'fresh': days > 3
 */
export function getFoodExpiryStatus(expiryDateStr?: string, referenceDate: Date = new Date()): FoodExpiryStatus {
  const days = getDaysUntilExpiry(expiryDateStr, referenceDate);
  if (days === null) return 'fresh';
  if (days < 0) return 'expired';
  if (days <= 3) return 'expiring_soon';
  return 'fresh';
}

/**
 * Generates human-friendly Persian badge text for an expiration date.
 * e.g. "۳ روز تا انقضا", "امروز منقضی می‌شود", "۲ روز گذشته (منقضی)"
 */
export function getExpiryBadgeText(expiryDateStr?: string, referenceDate: Date = new Date()): {
  text: string;
  status: FoodExpiryStatus;
  days: number | null;
} {
  const days = getDaysUntilExpiry(expiryDateStr, referenceDate);
  if (days === null) {
    return { text: 'بدون تاریخ', status: 'fresh', days: null };
  }

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: `${toPersianDigits(absDays)} روز منقضی شده`,
      status: 'expired',
      days,
    };
  }

  if (days === 0) {
    return {
      text: 'امروز منقضی می‌شود!',
      status: 'expiring_soon',
      days,
    };
  }

  if (days <= 3) {
    return {
      text: `${toPersianDigits(days)} روز تا انقضا`,
      status: 'expiring_soon',
      days,
    };
  }

  return {
    text: `${toPersianDigits(days)} روز مانده`,
    status: 'fresh',
    days,
  };
}

/**
 * Filters and sorts items that need urgent consumption ("اول این مواد را مصرف کن").
 * Items expiring in <= 3 days (or already expired) are prioritized, with fewest days remaining first.
 */
export function getUrgentIngredients(
  inventory: Ingredient[],
  referenceDate: Date = new Date()
): { item: Ingredient; daysLeft: number; status: FoodExpiryStatus }[] {
  const activeItems = inventory.filter((item) => item.quantity > 0 && !item.isConsumed);

  const urgentList: { item: Ingredient; daysLeft: number; status: FoodExpiryStatus }[] = [];

  for (const item of activeItems) {
    const days = getDaysUntilExpiry(item.expiryDate, referenceDate);
    if (days !== null && days <= 3) {
      urgentList.push({
        item,
        daysLeft: days,
        status: days < 0 ? 'expired' : 'expiring_soon',
      });
    }
  }

  // Sort: most critical (lowest/negative days) first
  urgentList.sort((a, b) => a.daysLeft - b.daysLeft);
  return urgentList;
}

/**
 * Suggests recipes with priority boost given to recipes that use ingredients
 * that are close to expiration (<= 3 days left).
 */
export function rankRecipesWithAntiWastePriority(
  recipes: Recipe[],
  inventory: Ingredient[],
  referenceDate: Date = new Date()
) {
  const urgentItems = getUrgentIngredients(inventory, referenceDate);
  const urgentNames = new Set(urgentItems.map((u) => u.item.name.trim().toLowerCase()));

  return recipes
    .map((recipe) => {
      const result = checkRecipeAvailability(recipe, inventory);
      const baseScore = compositeScore(result);

      // Count how many expiring ingredients this recipe rescues
      let expiringCount = 0;
      for (const req of recipe.ingredients) {
        if (urgentNames.has(req.name.trim().toLowerCase())) {
          expiringCount += 1;
        }
      }

      // 40 points bonus per expiring ingredient rescued
      const antiWasteBonus = expiringCount * 40;

      return {
        ...result,
        expiringCount,
        antiWasteBonus,
        wasteWeightedScore: baseScore + antiWasteBonus,
      };
    })
    .sort((a, b) => b.wasteWeightedScore - a.wasteWeightedScore);
}

/**
 * Helper to calculate item financial value (quantity * estimatedPrice).
 */
export function calculateItemValue(item: Ingredient): number {
  const price = item.estimatedPrice ?? DEFAULT_INGREDIENT_PRICES[item.name] ?? 20000;
  return item.quantity * price;
}
