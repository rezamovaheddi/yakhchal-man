import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appStorage } from '../utils/appStorage';
import { FridgeData, Ingredient } from '../types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const DEFAULT_CATALOG: Ingredient[] = [
  { id: 'cat-1', name: 'تخم‌مرغ', quantity: 4, unit: 'عدد', category: 'پروتئین', iconName: 'egg' },
  { id: 'cat-2', name: 'شیر', quantity: 1, unit: 'لیتر', category: 'لبنیات', iconName: 'milk' },
];

const USER_A = 'usr-001';
const USER_B = 'usr-002';

describe('appStorage — per-user fridge isolation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('returns default fridge data when no record exists', async () => {
    const data = await appStorage.loadFridgeData(USER_A, 'یخچال آزمون', DEFAULT_CATALOG);
    expect(data.fridgeName).toBe('یخچال آزمون');
    expect(data.inventory).toEqual([]);
    expect(data.homeStep).toBe('build_fridge');
    expect(data.catalogItems).toEqual(DEFAULT_CATALOG);
  });

  test('saves and reloads fridge data for a user', async () => {
    const toSave: FridgeData = {
      fridgeName: 'یخچال رضا',
      inventory: [
        { id: 'ing-1', name: 'تخم‌مرغ', quantity: 6, unit: 'عدد', category: 'پروتئین', iconName: 'egg' },
      ],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: ['cat-1'],
      homeStep: 'suggestion_and_items',
    };

    await appStorage.saveFridgeData(USER_A, toSave);
    const loaded = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);

    expect(loaded.fridgeName).toBe('یخچال رضا');
    expect(loaded.inventory).toHaveLength(1);
    expect(loaded.inventory[0].quantity).toBe(6);
    expect(loaded.homeStep).toBe('suggestion_and_items');
    expect(loaded.selectedItemIds).toContain('cat-1');
  });

  test('user A and user B have completely separate fridge data', async () => {
    const fridgeA: FridgeData = {
      fridgeName: 'یخچال علی',
      inventory: [{ id: 'i1', name: 'پنیر', quantity: 2, unit: 'بسته', category: 'لبنیات', iconName: 'cheese' }],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: ['i1'],
      homeStep: 'suggestion_and_items',
    };

    const fridgeB: FridgeData = {
      fridgeName: 'یخچال مریم',
      inventory: [{ id: 'i2', name: 'هویج', quantity: 5, unit: 'عدد', category: 'سبزیجات', iconName: 'carrot' }],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: ['i2'],
      homeStep: 'select_items',
    };

    await appStorage.saveFridgeData(USER_A, fridgeA);
    await appStorage.saveFridgeData(USER_B, fridgeB);

    const loadedA = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);
    const loadedB = await appStorage.loadFridgeData(USER_B, 'پیش‌فرض', DEFAULT_CATALOG);

    // Data must be completely isolated — no cross-contamination
    expect(loadedA.fridgeName).toBe('یخچال علی');
    expect(loadedA.inventory[0].name).toBe('پنیر');
    expect(loadedB.fridgeName).toBe('یخچال مریم');
    expect(loadedB.inventory[0].name).toBe('هویج');
  });

  test('modifying user B data does not affect user A', async () => {
    const base: FridgeData = {
      fridgeName: 'یخچال مشترک',
      inventory: [],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: [],
      homeStep: 'build_fridge',
    };

    await appStorage.saveFridgeData(USER_A, { ...base, fridgeName: 'یخچال A' });
    await appStorage.saveFridgeData(USER_B, { ...base, fridgeName: 'یخچال B' });

    // Update only B's fridge name
    await appStorage.patchFridgeData(USER_B, { fridgeName: 'یخچال B جدید' }, 'پیش‌فرض', DEFAULT_CATALOG);

    const loadedA = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);
    const loadedB = await appStorage.loadFridgeData(USER_B, 'پیش‌فرض', DEFAULT_CATALOG);

    expect(loadedA.fridgeName).toBe('یخچال A');   // unchanged
    expect(loadedB.fridgeName).toBe('یخچال B جدید');
  });

  test('patchFridgeData merges partial updates without losing other fields', async () => {
    const initial: FridgeData = {
      fridgeName: 'یخچال آزمون',
      inventory: [{ id: 'x', name: 'سیب', quantity: 3, unit: 'عدد', category: 'سبزیجات', iconName: 'apple' }],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: ['x'],
      homeStep: 'suggestion_and_items',
    };

    await appStorage.saveFridgeData(USER_A, initial);
    // Only update the inventory quantity
    await appStorage.patchFridgeData(
      USER_A,
      { inventory: [{ id: 'x', name: 'سیب', quantity: 7, unit: 'عدد', category: 'سبزیجات', iconName: 'apple' }] },
      'پیش‌فرض',
      DEFAULT_CATALOG
    );

    const loaded = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);
    expect(loaded.inventory[0].quantity).toBe(7);
    // All other fields must still be intact
    expect(loaded.fridgeName).toBe('یخچال آزمون');
    expect(loaded.homeStep).toBe('suggestion_and_items');
    expect(loaded.selectedItemIds).toContain('x');
  });

  test('clearFridgeData resets to defaults without removing the user record', async () => {
    const data: FridgeData = {
      fridgeName: 'یخچال پر',
      inventory: [{ id: 'y', name: 'ماست', quantity: 2, unit: 'بسته', category: 'لبنیات', iconName: 'yogurt' }],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: ['y'],
      homeStep: 'suggestion_and_items',
    };

    await appStorage.saveFridgeData(USER_A, data);
    await appStorage.clearFridgeData(USER_A, 'یخچال خالی', DEFAULT_CATALOG);

    const loaded = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);
    expect(loaded.fridgeName).toBe('یخچال خالی');
    expect(loaded.inventory).toHaveLength(0);
    expect(loaded.homeStep).toBe('build_fridge');
  });

  test('deleteFridgeData removes the key; next load returns defaults', async () => {
    await appStorage.saveFridgeData(USER_A, {
      fridgeName: 'یخچال موقت',
      inventory: [],
      catalogItems: DEFAULT_CATALOG,
      selectedItemIds: [],
      homeStep: 'select_items',
    });

    await appStorage.deleteFridgeData(USER_A);

    const loaded = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);
    expect(loaded.fridgeName).toBe('پیش‌فرض');
    expect(loaded.homeStep).toBe('build_fridge');
  });

  test('migrates legacy global keys for the first user who logs in', async () => {
    // Simulate data written by the old non-per-user version of the app
    const legacyInventory: Ingredient[] = [
      { id: 'old-1', name: 'گوجه', quantity: 3, unit: 'عدد', category: 'سبزیجات', iconName: 'tomato' },
    ];

    await AsyncStorage.multiSet([
      ['@yakhchal_inventory', JSON.stringify(legacyInventory)],
      ['@yakhchal_fridge_name', 'یخچال قدیمی'],
      ['@yakhchal_home_step', 'suggestion_and_items'],
      ['@yakhchal_selected_ids', JSON.stringify(['old-1'])],
      ['@yakhchal_catalog_items', JSON.stringify(DEFAULT_CATALOG)],
    ]);

    // First load for this user should trigger migration
    const loaded = await appStorage.loadFridgeData(USER_A, 'پیش‌فرض', DEFAULT_CATALOG);

    expect(loaded.fridgeName).toBe('یخچال قدیمی');
    expect(loaded.inventory[0].name).toBe('گوجه');
    expect(loaded.homeStep).toBe('suggestion_and_items');

    // Legacy keys must have been erased after migration
    const remaining = await AsyncStorage.multiGet([
      '@yakhchal_inventory',
      '@yakhchal_fridge_name',
    ]);
    expect(remaining[0][1]).toBeNull();
    expect(remaining[1][1]).toBeNull();

    // A second different user should get defaults, not the migrated data
    const loadedB = await appStorage.loadFridgeData(USER_B, 'پیش‌فرض', DEFAULT_CATALOG);
    expect(loadedB.fridgeName).toBe('پیش‌فرض');
    expect(loadedB.inventory).toHaveLength(0);
  });
});
