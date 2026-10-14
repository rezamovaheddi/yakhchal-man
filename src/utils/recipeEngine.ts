import { Ingredient, Recipe } from '../types';

export interface RecipeAvailabilityResult {
  recipe: Recipe;
  totalRequired: number;
  availableCount: number;
  percentage: number;
  isFullyAvailable: boolean;
  missingIngredients: string[];
}

/**
 * Checks the availability of ingredients for a given recipe against fridge items.
 */
export const checkRecipeAvailability = (
  recipe: Recipe,
  inventory: Ingredient[]
): RecipeAvailabilityResult => {
  const missingIngredients: string[] = [];
  let availableCount = 0;

  recipe.ingredients.forEach((req) => {
    // Look for matching ingredient name (case-insensitive & Persian trimmed)
    const normalizedReq = req.name.trim().toLowerCase();
    const found = inventory.find(
      (item) =>
        item.name.trim().toLowerCase().includes(normalizedReq) ||
        normalizedReq.includes(item.name.trim().toLowerCase())
    );

    if (found && found.quantity >= req.requiredQuantity) {
      availableCount += 1;
    } else {
      missingIngredients.push(req.name);
    }
  });

  const totalRequired = recipe.ingredients.length;
  const percentage = totalRequired > 0 ? Math.round((availableCount / totalRequired) * 100) : 0;

  return {
    recipe,
    totalRequired,
    availableCount,
    percentage,
    isFullyAvailable: availableCount === totalRequired,
    missingIngredients,
  };
};

/**
 * Ranks all recipes based on current inventory availability.
 */
export const rankRecipesByAvailability = (
  recipes: Recipe[],
  inventory: Ingredient[]
): RecipeAvailabilityResult[] => {
  return recipes
    .map((recipe) => checkRecipeAvailability(recipe, inventory))
    .sort((a, b) => b.percentage - a.percentage);
};
