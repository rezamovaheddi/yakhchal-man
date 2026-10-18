import { Ingredient, IngredientUnit, Recipe } from '../types';

export interface RecipeAvailabilityResult {
  recipe: Recipe;
  totalRequired: number;
  availableCount: number;
  /** Quantity-weighted match percentage (0–100). */
  percentage: number;
  isFullyAvailable: boolean;
  missingIngredients: string[];
}

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------
// Conversion factors relative to a common base unit for each dimension.
// Only units that are meaningfully interchangeable are included.

type UnitDimension = 'volume' | 'weight' | 'count' | 'spoon';

interface UnitInfo {
  dimension: UnitDimension;
  /** How many of this unit make one "base" unit of the dimension. */
  toBase: number;
}

const UNIT_MAP: Record<IngredientUnit, UnitInfo> = {
  لیتر:   { dimension: 'volume', toBase: 1 },
  کیلوگرم: { dimension: 'weight', toBase: 1 },
  عدد:   { dimension: 'count',  toBase: 1 },
  بسته:  { dimension: 'count',  toBase: 1 },
  حبه:   { dimension: 'count',  toBase: 1 },
  قاشق:  { dimension: 'spoon',  toBase: 1 },
};

/**
 * Converts `amount` from `from` unit to `to` unit.
 * Returns null if the units belong to different dimensions (not convertible).
 */
function convertUnit(amount: number, from: IngredientUnit, to: IngredientUnit): number | null {
  const fromInfo = UNIT_MAP[from];
  const toInfo   = UNIT_MAP[to];
  if (!fromInfo || !toInfo) return null;
  if (fromInfo.dimension !== toInfo.dimension) return null;
  return (amount * fromInfo.toBase) / toInfo.toBase;
}

// ---------------------------------------------------------------------------
// Persian name normalisation
// ---------------------------------------------------------------------------

/** Unicode normalization table for common Persian/Arabic variant characters. */
const PERSIAN_CHAR_MAP: Record<string, string> = {
  // Arabic ك → Persian ک
  '\u0643': '\u06A9',
  // Arabic ي → Persian ی
  '\u064A': '\u06CC',
  // Arabic ة → Persian ه
  '\u0629': '\u0647',
  // Zero-width non-joiner (ZWNJ) is kept as-is so تخم‌مرغ stays distinct from تخممرغ
};

/**
 * Normalises a Persian ingredient name for fuzzy comparison:
 * - Trims whitespace
 * - Lowercases (covers Latin chars in mixed names)
 * - Replaces Arabic letter variants with Persian equivalents
 * - Collapses multiple spaces
 */
export function normalizePersianName(name: string): string {
  let result = name.trim().toLowerCase();
  for (const [from, to] of Object.entries(PERSIAN_CHAR_MAP)) {
    result = result.split(from).join(to);
  }
  result = result.replace(/\s+/g, ' ');
  return result;
}

/**
 * Returns true when `a` and `b` are the same ingredient name after normalisation.
 * Uses exact-match after normalisation (no substring tricks that cause false positives).
 */
function namesMatch(a: string, b: string): boolean {
  const na = normalizePersianName(a);
  const nb = normalizePersianName(b);
  return na === nb;
}

// ---------------------------------------------------------------------------
// Inventory consolidation
// ---------------------------------------------------------------------------

interface ConsolidatedItem {
  name: string;
  unit: IngredientUnit;
  totalQuantity: number;
}

/**
 * Merges duplicate inventory entries (same normalised name + same unit) by
 * summing their quantities. Entries with different units are kept separate
 * since they may not be directly comparable.
 */
function consolidateInventory(inventory: Ingredient[]): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem>();

  for (const item of inventory) {
    const key = `${normalizePersianName(item.name)}::${item.unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalQuantity += item.quantity;
    } else {
      map.set(key, {
        name: item.name,
        unit: item.unit,
        totalQuantity: item.quantity,
      });
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Core availability check
// ---------------------------------------------------------------------------

/**
 * Checks ingredient availability for a recipe against the current fridge inventory.
 *
 * Improvements over previous version:
 * 1. Names are matched after Persian normalisation (exact match, no substring).
 * 2. Units are considered — only compatible units are compared numerically.
 * 3. Duplicate inventory entries for the same ingredient are summed before comparison.
 * 4. The match percentage is quantity-weighted: each ingredient contributes a
 *    partial score based on how much of the required amount is available.
 */
export const checkRecipeAvailability = (
  recipe: Recipe,
  inventory: Ingredient[]
): RecipeAvailabilityResult => {
  const consolidated = consolidateInventory(inventory);
  const missingIngredients: string[] = [];

  // Weighted scoring: each ingredient contributes up to 1.0
  let weightedScore = 0;

  for (const req of recipe.ingredients) {
    // Find all consolidated inventory entries whose name matches the requirement
    const candidates = consolidated.filter((item) => namesMatch(item.name, req.name));

    if (candidates.length === 0) {
      missingIngredients.push(req.name);
      continue;
    }

    // Prefer exact-unit match; otherwise attempt conversion
    let bestCoverage = 0;

    for (const candidate of candidates) {
      let available: number;

      if (candidate.unit === req.unit) {
        available = candidate.totalQuantity;
      } else {
        const converted = convertUnit(candidate.totalQuantity, candidate.unit, req.unit);
        if (converted === null) continue; // incompatible units — skip
        available = converted;
      }

      const coverage = req.requiredQuantity > 0
        ? Math.min(1, available / req.requiredQuantity)
        : 1;

      if (coverage > bestCoverage) {
        bestCoverage = coverage;
      }
    }

    if (bestCoverage > 0) {
      weightedScore += bestCoverage;
      if (bestCoverage < 1) {
        // Partially available → still counts as missing for the "fully available" flag
        missingIngredients.push(req.name);
      }
    } else {
      missingIngredients.push(req.name);
    }
  }

  const totalRequired = recipe.ingredients.length;
  const percentage = totalRequired > 0 ? Math.round((weightedScore / totalRequired) * 100) : 0;
  const availableCount = recipe.ingredients.length - missingIngredients.length;

  return {
    recipe,
    totalRequired,
    availableCount,
    percentage,
    isFullyAvailable: missingIngredients.length === 0,
    missingIngredients,
  };
};

/**
 * Ranks all recipes based on quantity-weighted availability percentage.
 */
export const rankRecipesByAvailability = (
  recipes: Recipe[],
  inventory: Ingredient[]
): RecipeAvailabilityResult[] => {
  return recipes
    .map((recipe) => checkRecipeAvailability(recipe, inventory))
    .sort((a, b) => b.percentage - a.percentage);
};

// ---------------------------------------------------------------------------
// Scoring — composite rank (availability % + prep-time bonus + difficulty bonus)
// ---------------------------------------------------------------------------

/** Maps difficulty label to a rank bonus (lower difficulty → higher bonus). */
const DIFFICULTY_BONUS: Record<string, number> = {
  'آسان': 15,
  'متوسط': 5,
  'سخت': 0,
};

/**
 * Extracts the leading integer from a Persian prep-time string like "۱۵ دقیقه".
 * Returns null when the string cannot be parsed.
 */
function parsePrepMinutes(prepTime: string): number | null {
  const ascii = prepTime.replace(/[۰-۹]/g, (d) =>
    String(d.charCodeAt(0) - '۰'.charCodeAt(0))
  );
  const match = ascii.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Composite score used to rank recipes.
 * Formula: availability_pct + difficulty_bonus - prep_penalty
 * prep_penalty = clamp(minutes / 5, 0, 10) so a 30-min recipe loses 6 points.
 */
export function compositeScore(result: RecipeAvailabilityResult): number {
  const diffBonus = DIFFICULTY_BONUS[result.recipe.difficulty] ?? 0;
  const minutes = parsePrepMinutes(result.recipe.prepTime);
  const prepPenalty = minutes != null ? Math.min(10, minutes / 5) : 5;
  // If fully available, add a big bonus to prioritize ready-to-cook recipes
  const readyBonus = result.isFullyAvailable ? 50 : 0;
  return result.percentage + readyBonus + diffBonus - prepPenalty;
}

/**
 * Ranks recipes by composite score (availability + readiness + ease + speed).
 */
export const rankRecipesByScore = (
  recipes: Recipe[],
  inventory: Ingredient[]
): RecipeAvailabilityResult[] =>
  recipes
    .map((recipe) => checkRecipeAvailability(recipe, inventory))
    .sort((a, b) => compositeScore(b) - compositeScore(a));

// ---------------------------------------------------------------------------
// Category / meal-time filter
// ---------------------------------------------------------------------------

export type MealFilter = 'همه' | 'صبحانه' | 'ناهار_شام' | 'دسر' | 'اقتصادی';

/** Category keywords that belong to each meal-time filter. */
const MEAL_KEYWORDS: Record<MealFilter, string[]> = {
  'همه': [],
  'صبحانه': ['صبحانه', 'عصرانه', 'پیش‌غذا'],
  'ناهار_شام': ['اصلی', 'سنتی', 'خورش', 'ناهار', 'شام'],
  'دسر': ['دسر', 'نوشیدنی', 'شیرینی'],
  'اقتصادی': ['اقتصادی', 'ارزان', 'صرفه'],
};

/**
 * Returns true when the recipe's category matches the given meal filter.
 * 'همه' always matches. 'اقتصادی' matches recipes with <= 3 ingredients.
 */
export function recipeMatchesFilter(
  result: RecipeAvailabilityResult,
  filter: MealFilter
): boolean {
  if (filter === 'همه') return true;
  if (filter === 'اقتصادی') return result.recipe.ingredients.length <= 3;
  const keywords = MEAL_KEYWORDS[filter];
  const cat = result.recipe.category;
  return keywords.some((kw) => cat.includes(kw));
}

// ---------------------------------------------------------------------------
// Ingredient substitution suggestions
// ---------------------------------------------------------------------------

/**
 * Static substitution table: maps a normalised ingredient name to a list of
 * possible substitutes.
 */
const SUBSTITUTES: Record<string, string[]> = {
  'شیر': ['ماست رقیق‌شده', 'خامه رقیق'],
  'پنیر': ['ماست چکیده', 'پنیر فتا'],
  'کره': ['روغن مایع', 'روغن زیتون'],
  'تخم‌مرغ': ['تخم بلدرچین (۳ عدد)', 'ماست (در برخی کوکوها)'],
  'گوشت': ['مرغ', 'قارچ (گیاهی)', 'سویا'],
  'مرغ و گوشت': ['تخم‌مرغ', 'قارچ (گیاهی)', 'سویا'],
  'قارچ': ['بادمجان', 'کدو سبز'],
  'سبزی کوکو': ['اسفناج و تره', 'سبزی معطر خشک'],
  'آرد': ['آرد برنج', 'پودر سوخاری', 'نشاسته'],
  'گردو': ['بادام', 'کنجد'],
  'سیب‌زمینی': ['کدو حلوایی'],
  'پیاز': ['پیازچه', 'پودر پیاز'],
  'گوجه‌فرنگی': ['رب گوجه‌فرنگی (نصف مقدار)', 'پوره گوجه'],
  'سیر': ['پودر سیر', 'سیر ترشی (بدون سرکه تند)'],
  'نان': ['نان تست', 'نان باگت', 'نان لواش'],
};

/**
 * Returns substitute suggestions for a list of missing ingredient names.
 */
export function suggestSubstitutes(
  missingIngredients: string[]
): Array<{ missing: string; substitutes: string[] }> {
  const results: Array<{ missing: string; substitutes: string[] }> = [];
  for (const name of missingIngredients) {
    const normalised = normalizePersianName(name);
    let subs = SUBSTITUTES[normalised] ?? SUBSTITUTES[name];
    if (!subs) {
      for (const [key, val] of Object.entries(SUBSTITUTES)) {
        if (normalizePersianName(key) === normalised) {
          subs = val;
          break;
        }
      }
    }
    if (subs && subs.length > 0) {
      results.push({ missing: name, substitutes: subs });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Servings scaler
// ---------------------------------------------------------------------------

/**
 * Full scaled availability check: scales recipe quantities then re-checks
 * against the actual inventory.
 * Base servings default is 2.
 */
export function checkRecipeAvailabilityForServings(
  recipe: Recipe,
  inventory: Ingredient[],
  servings: number
): RecipeAvailabilityResult {
  const BASE_SERVINGS = 2;
  const factor = servings / BASE_SERVINGS;
  const scaledRecipe: Recipe = {
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      requiredQuantity: Math.max(1, Math.ceil(ing.requiredQuantity * factor)),
    })),
  };
  return checkRecipeAvailability(scaledRecipe, inventory);
}

/**
 * Generates an intuitive summary text like:
 * «با مواد فعلی می‌توانی ۴ غذا درست کنی؛ برای کوکو فقط سبزی کوکو کم داری.»
 */
export function getSmartRecipeSummary(
  recipes: Recipe[],
  inventory: Ingredient[]
): string {
  const evaluated = recipes.map((r) => checkRecipeAvailability(r, inventory));
  const readyCount = evaluated.filter((e) => e.isFullyAvailable).length;

  // Find a recipe with just 1 missing ingredient
  const almostReady = evaluated.find(
    (e) => !e.isFullyAvailable && e.missingIngredients.length === 1
  );

  const readyText = readyCount > 0
    ? `با مواد فعلی می‌توانی ${readyCount} غذا درست کنی`
    : `هنوز غذایی با موجودی ۱۰۰٪ کامل نداری`;

  if (almostReady) {
    return `${readyText}؛ برای «${almostReady.recipe.title}» فقط ${almostReady.missingIngredients[0]} کم داری.`;
  }

  return `${readyText}.`;
}

