import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeData, Ingredient } from '../types';

// ---------------------------------------------------------------------------
// Key helpers — all data is namespaced by userId
// ---------------------------------------------------------------------------
// Layout:  @yakhchal_fridge/<userId>
//
// A single JSON blob per user stores everything that belongs to their fridge.
// Keeping it as one key means we can atomically load and save the full
// profile, making switch-user operations safe and simple.
// ---------------------------------------------------------------------------

const FRIDGE_KEY = (userId: string) => `@yakhchal_fridge/${userId}`;

// Legacy global keys (pre-isolation).  Used only for the one-time migration.
const LEGACY_KEYS = [
  '@yakhchal_inventory',
  '@yakhchal_fridge_name',
  '@yakhchal_home_step',
  '@yakhchal_selected_ids',
  '@yakhchal_catalog_items',
];

// ---------------------------------------------------------------------------
// Default fridge data factory
// ---------------------------------------------------------------------------
function defaultFridgeData(
  fridgeName: string,
  defaultCatalog: Ingredient[]
): FridgeData {
  return {
    fridgeName,
    inventory: [],
    catalogItems: defaultCatalog,
    selectedItemIds: [],
    homeStep: 'build_fridge',
    antiWasteStats: {
      monthlySavedTomans: 0,
      monthlyWastedTomans: 0,
      consumedItemsCount: 0,
      wastedItemsCount: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const appStorage = {
  /**
   * Loads the fridge data for a specific user.
   * Falls back to default values when no data has been saved yet.
   *
   * Also performs a one-time migration from the legacy global keys
   * (from before per-user isolation was introduced).
   */
  async loadFridgeData(
    userId: string,
    defaultFridgeName: string,
    defaultCatalog: Ingredient[]
  ): Promise<FridgeData> {
    try {
      const raw = await AsyncStorage.getItem(FRIDGE_KEY(userId));
      if (raw) {
        return JSON.parse(raw) as FridgeData;
      }

      // ── One-time migration from legacy global keys ──────────────────────
      // If there is no per-user record yet, check whether the old global
      // keys hold data (written by an earlier version of the app).  If so,
      // adopt that data for this user and immediately erase the global keys
      // so we never migrate again and don't leak data to future new users.
      const legacyData = await this._readLegacyKeys(defaultFridgeName, defaultCatalog);
      if (legacyData) {
        await this.saveFridgeData(userId, legacyData);
        await AsyncStorage.multiRemove(LEGACY_KEYS);
        return legacyData;
      }
      // ────────────────────────────────────────────────────────────────────

      return defaultFridgeData(defaultFridgeName, defaultCatalog);
    } catch (e) {
      console.warn(`[appStorage] Error loading fridge data for ${userId}:`, e);
      return defaultFridgeData(defaultFridgeName, defaultCatalog);
    }
  },

  /**
   * Atomically saves the full fridge data for a user.
   */
  async saveFridgeData(userId: string, data: FridgeData): Promise<void> {
    try {
      await AsyncStorage.setItem(FRIDGE_KEY(userId), JSON.stringify(data));
    } catch (e) {
      console.warn(`[appStorage] Error saving fridge data for ${userId}:`, e);
    }
  },

  /**
   * Partially updates the stored fridge data for a user.
   * Performs a read-modify-write; only the provided fields are overwritten.
   */
  async patchFridgeData(
    userId: string,
    patch: Partial<FridgeData>,
    defaultFridgeName: string,
    defaultCatalog: Ingredient[]
  ): Promise<void> {
    try {
      const current = await this.loadFridgeData(userId, defaultFridgeName, defaultCatalog);
      await this.saveFridgeData(userId, { ...current, ...patch });
    } catch (e) {
      console.warn(`[appStorage] Error patching fridge data for ${userId}:`, e);
    }
  },

  /**
   * Clears the fridge data for a specific user (e.g. on fridge reset).
   * Resets to an empty fridge; does not delete the key itself.
   */
  async clearFridgeData(
    userId: string,
    defaultFridgeName: string,
    defaultCatalog: Ingredient[]
  ): Promise<void> {
    await this.saveFridgeData(
      userId,
      defaultFridgeData(defaultFridgeName, defaultCatalog)
    );
  },

  /**
   * Removes the fridge data record entirely for a user.
   * Use this when a profile is deleted (future feature).
   */
  async deleteFridgeData(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(FRIDGE_KEY(userId));
    } catch (e) {
      console.warn(`[appStorage] Error deleting fridge data for ${userId}:`, e);
    }
  },

  // ── Internal / migration helpers ─────────────────────────────────────────

  /**
   * Reads the old global storage keys and returns a `FridgeData` object if
   * any legacy data exists, or `null` if the keys are empty / absent.
   * @internal
   */
  async _readLegacyKeys(
    defaultFridgeName: string,
    defaultCatalog: Ingredient[]
  ): Promise<FridgeData | null> {
    try {
      const [inventory, fridgeName, homeStep, selectedIds, catalog] =
        await AsyncStorage.multiGet(LEGACY_KEYS);

      const hasAny =
        inventory[1] || fridgeName[1] || homeStep[1] || selectedIds[1] || catalog[1];
      if (!hasAny) return null;

      return {
        inventory: inventory[1] ? (JSON.parse(inventory[1]) as Ingredient[]) : [],
        fridgeName: fridgeName[1] ?? defaultFridgeName,
        homeStep: homeStep[1] ?? 'build_fridge',
        selectedItemIds: selectedIds[1] ? (JSON.parse(selectedIds[1]) as string[]) : [],
        catalogItems: catalog[1] ? (JSON.parse(catalog[1]) as Ingredient[]) : defaultCatalog,
      };
    } catch {
      return null;
    }
  },
};
