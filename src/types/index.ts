export type IngredientUnit = 'عدد' | 'بسته' | 'لیتر' | 'کیلوگرم' | 'حبه' | 'قاشق';

export type IngredientCategory = 'لبنیات' | 'سبزیجات' | 'پروتئین' | 'ادویه و چاشنی' | 'سایر';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
  category: IngredientCategory;
  iconName: string;
  minimumRequired?: number;
}

export interface RecipeIngredientRequirement {
  name: string;
  requiredQuantity: number;
  unit: IngredientUnit;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  difficulty: 'آسان' | 'متوسط' | 'سخت';
  ingredients: RecipeIngredientRequirement[];
  instructions: string[];
  tips?: string[];
  iconName: string;
  category: string;
}

export type TabType = 'home' | 'cooking' | 'recipes';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'warning';
}
