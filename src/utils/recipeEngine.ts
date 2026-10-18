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
