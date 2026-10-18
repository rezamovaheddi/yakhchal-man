export type IngredientUnit = 'عدد' | 'بسته' | 'لیتر' | 'کیلوگرم' | 'حبه' | 'قاشق';

export type IngredientCategory = 'لبنیات' | 'سبزیجات' | 'پروتئین' | 'ادویه و چاشنی' | 'سایر';

export type StorageLocation = 'یخچال' | 'فریزر' | 'کابینت';

export type FoodExpiryStatus = 'fresh' | 'expiring_soon' | 'expired';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
  category: IngredientCategory;
  iconName: string;
  minimumRequired?: number;
  /** Storage location: یخچال, فریزر, کابینت */
  storageLocation?: StorageLocation;
  /** Expiration date in ISO string format (YYYY-MM-DD) */
  expiryDate?: string;
  /** Estimated price in Tomans per unit (e.g. 25,000) for savings tracking */
  estimatedPrice?: number;
  /** Whether the item has been marked as consumed */
  isConsumed?: boolean;
}

export interface WasteTrackingStats {
  /** Total value of food consumed in Tomans this month */
  monthlySavedTomans: number;
  /** Total value of food wasted/thrown away in Tomans this month */
  monthlyWastedTomans: number;
  /** Number of items consumed on time */
  consumedItemsCount: number;
  /** Number of items expired/wasted */
  wastedItemsCount: number;
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

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  avatar: string;
  createdAt: string;
  fridgeName?: string;
}

/**
 * All fridge-specific data that belongs to a single user/profile.
 * Stored under a per-user key so profiles never share inventory.
 */
export interface FridgeData {
  /** User-visible fridge name */
  fridgeName: string;
  /** Current fridge inventory */
  inventory: Ingredient[];
  /** Catalog with user edits (quantities, custom items) */
  catalogItems: Ingredient[];
  /** IDs of items selected in the setup wizard */
  selectedItemIds: string[];
  /** Last saved wizard step */
  homeStep: string;
  /** Anti-waste tracking statistics */
  antiWasteStats?: WasteTrackingStats;
}

export interface AppReleaseInfo {
  version: string;
  title: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl?: string;
  webUrl: string;
  isMandatory?: boolean;
}

export type UpdateCheckState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up_to_date'
  | 'error';


