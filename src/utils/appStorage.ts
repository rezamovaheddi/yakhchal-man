import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ingredient } from '../types';

const STORAGE_INVENTORY_KEY = '@yakhchal_inventory';
const STORAGE_FRIDGE_NAME_KEY = '@yakhchal_fridge_name';
const STORAGE_HOME_STEP_KEY = '@yakhchal_home_step';
const STORAGE_SELECTED_IDS_KEY = '@yakhchal_selected_ids';
const STORAGE_CATALOG_ITEMS_KEY = '@yakhchal_catalog_items';

export interface PersistedAppState {
  inventory: Ingredient[];
  fridgeName: string;
  homeStep: string;
  selectedItemIds: string[];
  catalogItems: Ingredient[];
}

/**
 * Persistent storage layer for app state.
 * This keeps fridge inventory, settings, and setup wizard progress
 * across app restarts.
 */
export const appStorage = {
  /**
   * Saves the full inventory list to persistent storage.
   */
  async saveInventory(items: Ingredient[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[appStorage] Error saving inventory:', e);
    }
  },

  /**
   * Loads the inventory list from persistent storage.
   */
  async loadInventory(): Promise<Ingredient[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_INVENTORY_KEY);
      return data ? (JSON.parse(data) as Ingredient[]) : [];
    } catch (e) {
      console.warn('[appStorage] Error loading inventory:', e);
      return [];
    }
  },

  /**
   * Saves the fridge name.
   */
  async saveFridgeName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_FRIDGE_NAME_KEY, name);
    } catch (e) {
      console.warn('[appStorage] Error saving fridge name:', e);
    }
  },

  /**
   * Loads the fridge name, falling back to the given default.
   */
  async loadFridgeName(defaultName: string): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_FRIDGE_NAME_KEY);
      return data ?? defaultName;
    } catch (e) {
      console.warn('[appStorage] Error loading fridge name:', e);
      return defaultName;
    }
  },

  /**
   * Saves the current setup-wizard step.
   */
  async saveHomeStep(step: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_HOME_STEP_KEY, step);
    } catch (e) {
      console.warn('[appStorage] Error saving home step:', e);
    }
  },

  /**
   * Loads the last saved setup-wizard step.
   */
  async loadHomeStep(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_HOME_STEP_KEY);
    } catch (e) {
      console.warn('[appStorage] Error loading home step:', e);
      return null;
    }
  },

  /**
   * Saves the set of selected catalog item IDs (as array).
   */
  async saveSelectedItemIds(ids: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_SELECTED_IDS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('[appStorage] Error saving selected item IDs:', e);
    }
  },

  /**
   * Loads selected catalog item IDs.
   */
  async loadSelectedItemIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_SELECTED_IDS_KEY);
      return data ? (JSON.parse(data) as string[]) : [];
    } catch (e) {
      console.warn('[appStorage] Error loading selected item IDs:', e);
      return [];
    }
  },

  /**
   * Saves the full catalog items list (including custom additions and quantity edits).
   */
  async saveCatalogItems(items: Ingredient[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_CATALOG_ITEMS_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[appStorage] Error saving catalog items:', e);
    }
  },

  /**
   * Loads catalog items. Returns null if not yet persisted (use default catalog).
   */
  async loadCatalogItems(): Promise<Ingredient[] | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_CATALOG_ITEMS_KEY);
      return data ? (JSON.parse(data) as Ingredient[]) : null;
    } catch (e) {
      console.warn('[appStorage] Error loading catalog items:', e);
      return null;
    }
  },

  /**
   * Loads all persisted state in one call for app startup.
   */
  async loadAll(defaultFridgeName: string, defaultCatalog: Ingredient[]): Promise<PersistedAppState> {
    const [inventory, fridgeName, homeStep, selectedItemIds, catalogItems] = await Promise.all([
      this.loadInventory(),
      this.loadFridgeName(defaultFridgeName),
      this.loadHomeStep(),
      this.loadSelectedItemIds(),
      this.loadCatalogItems(),
    ]);

    return {
      inventory,
      fridgeName,
      homeStep: homeStep ?? 'build_fridge',
      selectedItemIds,
      catalogItems: catalogItems ?? defaultCatalog,
    };
  },

  /**
   * Clears all app state (e.g. when resetting the fridge).
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_INVENTORY_KEY,
        STORAGE_FRIDGE_NAME_KEY,
        STORAGE_HOME_STEP_KEY,
        STORAGE_SELECTED_IDS_KEY,
        STORAGE_CATALOG_ITEMS_KEY,
      ]);
    } catch (e) {
      console.warn('[appStorage] Error clearing app state:', e);
    }
  },
};
