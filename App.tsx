import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  I18nManager,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
  Vazirmatn_900Black,
} from '@expo-google-fonts/vazirmatn';

import { FridgeData, Ingredient, Recipe, TabType, ToastMessage, UserAccount } from './src/types';
import { RECIPES, CATALOG_INGREDIENTS } from './src/constants/initialData';
import { COLORS, BORDER, RETRO_SHADOW } from './src/constants/theme';
import { checkRecipeAvailability, rankRecipesByScore } from './src/utils/recipeEngine';
import { authStorage } from './src/utils/authStorage';
import { appStorage } from './src/utils/appStorage';

import { HomeScreen } from './src/screens/HomeScreen';
import { CookingScreen } from './src/screens/CookingScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { RetroTabBar } from './src/components/navigation/RetroTabBar';
import { AddIngredientModal } from './src/components/modals/AddIngredientModal';
import { RecipeDetailsModal } from './src/components/modals/RecipeDetailsModal';
import { AuthModal } from './src/components/modals/AuthModal';
import { UserProfileModal } from './src/components/modals/UserProfileModal';
import { HomeStep } from './src/components/home/StepWizardBar';

// Enable RTL layout
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch (e) {
    console.warn('RTL error:', e);
  }
}

const INITIAL_CATALOG: Ingredient[] = CATALOG_INGREDIENTS.map((item, index) => ({
  ...item,
  id: `cat-${index + 1}`,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultFridgeName(user: UserAccount | null): string {
  return user?.fridgeName ?? 'یخچال خونه ما';
}

function fridgeDataToState(data: FridgeData) {
  return {
    fridgeName: data.fridgeName,
    inventory: data.inventory,
    catalogItems: data.catalogItems,
    selectedItemIds: new Set(data.selectedItemIds),
    homeStep: (data.homeStep as HomeStep) ?? 'build_fridge',
    isFridgeCreated: data.homeStep !== 'build_fridge',
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function MainApp() {
  const insets = useSafeAreaInsets();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // ── Fridge / wizard state ─────────────────────────────────────────────────
  const [fridgeName, setFridgeName] = useState('یخچال خونه ما');
  const [isFridgeCreated, setIsFridgeCreated] = useState(false);
  const [homeStep, setHomeStep] = useState<HomeStep>('build_fridge');
  const [catalogItems, setCatalogItems] = useState<Ingredient[]>(INITIAL_CATALOG);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // ── Navigation / UI ───────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [recommendedRecipeIndex, setRecommendedRecipeIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Guard: skip the first-render auto-save triggered by state initialisation
  const isHydrated = useRef(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
      const id = Date.now().toString();
      setToast({ id, text, type });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3000);
    },
    []
  );

  // ── Hydrate from storage ───────────────────────────────────────────────────
  /**
   * Loads fridge data for `user` and applies it to local state.
   * Passing null clears the fridge back to defaults (guest/no-user mode).
   */
  const hydrateFridgeForUser = useCallback(
    async (user: UserAccount | null) => {
      isHydrated.current = false; // pause auto-saves during hydration

      const defName = defaultFridgeName(user);

      const data = user
        ? await appStorage.loadFridgeData(user.id, defName, INITIAL_CATALOG)
        : {
            fridgeName: defName,
            inventory: [],
            catalogItems: INITIAL_CATALOG,
            selectedItemIds: [],
            homeStep: 'build_fridge' as HomeStep,
          };

      const s = fridgeDataToState(data);
      setFridgeName(s.fridgeName);
      setInventory(s.inventory);
      setCatalogItems(s.catalogItems);
      setSelectedItemIds(s.selectedItemIds);
      setHomeStep(s.homeStep);
      setIsFridgeCreated(s.isFridgeCreated);
      setRecommendedRecipeIndex(0);

      // Allow auto-saves on the next tick (after React flushes state updates)
      requestAnimationFrame(() => {
        isHydrated.current = true;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Wrapper that also keeps `ingredients` in sync (separate setter reference
  // needed because React batches updates and we want both to land together)
  const setInventory = (inv: Ingredient[]) => setIngredients(inv);

  // Startup: restore session then load that user's fridge
  useEffect(() => {
    const init = async () => {
      const user = await authStorage.getCurrentUser();
      setCurrentUser(user);
      await hydrateFridgeForUser(user);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-user auto-save ────────────────────────────────────────────────────
  /**
   * Assembles the current fridge state into a `FridgeData` blob and persists
   * it under the active user's key.  Runs after every relevant state change,
   * but only once the initial hydration is complete (to avoid overwriting
   * persisted data with empty defaults).
   */
  const persistFridgeData = useCallback(
    (
      userId: string | undefined,
      data: FridgeData,
      defName: string
    ) => {
      if (!isHydrated.current || !userId) return;
      appStorage.saveFridgeData(userId, data);
    },
    []
  );

  // Single combined effect — runs whenever any fridge slice changes
  useEffect(() => {
    if (!isHydrated.current || !currentUser) return;
    persistFridgeData(currentUser.id, {
      fridgeName,
      inventory: ingredients,
      catalogItems,
      selectedItemIds: Array.from(selectedItemIds),
      homeStep,
    }, defaultFridgeName(currentUser));
  }, [fridgeName, ingredients, catalogItems, selectedItemIds, homeStep, currentUser, persistFridgeData]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleAuthSuccess = useCallback(
    async (user: UserAccount, mode: 'login' | 'register') => {
      setCurrentUser(user);
      await hydrateFridgeForUser(user);
      if (mode === 'register') {
        showToast(`خوش آمدید، ${user.name}! پروفایل شما ساخته شد. 🎉`);
      } else {
        showToast(`خوش آمدید، ${user.name}! با موفقیت وارد شدید. 🔑`);
      }
    },
    [hydrateFridgeForUser, showToast]
  );

  const handleLogout = useCallback(async () => {
    await authStorage.logout();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    // Reset fridge to guest defaults — do NOT persist (no userId)
    isHydrated.current = false;
    setFridgeName('یخچال خونه ما');
    setIngredients([]);
    setCatalogItems(INITIAL_CATALOG);
    setSelectedItemIds(new Set());
    setHomeStep('build_fridge');
    setIsFridgeCreated(false);
    isHydrated.current = false; // keep paused — guest state is ephemeral
    showToast('با موفقیت از پروفایل خارج شدید. 🚪', 'info');
  }, [showToast]);

  const handleSwitchAccount = useCallback(() => {
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(true);
  }, []);

  // ── Step 1: Fridge creation ───────────────────────────────────────────────
  const handleBuildFridge = useCallback(
    (name: string, _model: string) => {
      setFridgeName(name);
      setIsFridgeCreated(true);
      setHomeStep('select_items');
      showToast(`یخچال «${name}» با موفقیت راه‌اندازی شد! حالا اقلام را انتخاب کنید ❄️`);
    },
    [showToast]
  );

  const handleResetFridge = useCallback(async () => {
    const defName = defaultFridgeName(currentUser);
    if (currentUser) {
      await appStorage.clearFridgeData(currentUser.id, defName, INITIAL_CATALOG);
    }
    isHydrated.current = false;
    setIsFridgeCreated(false);
    setHomeStep('build_fridge');
    setFridgeName(defName);
    setIngredients([]);
    setSelectedItemIds(new Set());
    setCatalogItems(INITIAL_CATALOG);
    requestAnimationFrame(() => { isHydrated.current = !!currentUser; });
    showToast('یخچال ریست شد. نام و مشخصات جدید را وارد کنید.', 'info');
  }, [currentUser, showToast]);

  // ── Step 2: Item selection ────────────────────────────────────────────────
  const handleToggleCatalogItem = useCallback((id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleIncrementCatalogItem = useCallback((id: string) => {
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
    setSelectedItemIds((prev) => new Set(prev).add(id));
  }, []);

  const handleDecrementCatalogItem = useCallback((id: string) => {
    setCatalogItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  }, []);

  const handleSelectAllItems = useCallback(() => {
    setSelectedItemIds(new Set(catalogItems.map((item) => item.id)));
  }, [catalogItems]);

  const handleDeselectAllItems = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (selectedItemIds.size === 0) {
      showToast('لطفاً حداقل یک قلم کالا برای یخچال انتخاب کنید! ⚠️', 'warning');
      return;
    }
    const chosen = catalogItems.filter((item) => selectedItemIds.has(item.id));
    setIngredients(chosen);
    setRecommendedRecipeIndex(0);
    setHomeStep('suggestion_and_items');
    showToast('پیشنهاد غذا بر اساس اقلام انتخابی شما آماده شد! 🍳', 'success');
  }, [catalogItems, selectedItemIds, showToast]);

  // ── Step 3: Inventory live-updates ────────────────────────────────────────
  const handleIncrementIngredient = useCallback((id: string) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }, []);

  const handleDecrementIngredient = useCallback((id: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      )
    );
    setCatalogItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      )
    );
  }, []);

  const handleAddCustomIngredient = useCallback(
    (newItem: Omit<Ingredient, 'id'>) => {
      const newId = `ing-${Date.now()}`;
      const fullItem: Ingredient = { ...newItem, id: newId };
      setCatalogItems((prev) => [fullItem, ...prev]);
      setSelectedItemIds((prev) => new Set(prev).add(newId));
      setIngredients((prev) => [fullItem, ...prev]);
      showToast(`«${newItem.name}» به موجودی یخچال اضافه شد! 🎉`);
    },
    [showToast]
  );

  // ── Recipe suggestions ────────────────────────────────────────────────────
  const rankedRecipes = rankRecipesByScore(RECIPES, ingredients);
  const currentRecommendation =
    rankedRecipes[recommendedRecipeIndex % rankedRecipes.length] ||
    checkRecipeAvailability(RECIPES[0], ingredients);

  const handleNextRecipe = useCallback(() => {
    setRecommendedRecipeIndex((prev) => (prev + 1) % RECIPES.length);
    showToast('پیشنهاد غذای بعدی بارگذاری شد! 🍽️', 'info');
  }, [showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Floating Retro Toast Notification */}
      {toast && (
        <View style={[styles.toastContainer, { top: insets.top + 8 }]}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast.text}</Text>
          </View>
        </View>
      )}

      {/* Main Screen Content */}
      <View style={[styles.mainArea, { paddingTop: insets.top }]}>
        {currentTab === 'home' && (
          <HomeScreen
            fridgeName={fridgeName}
            isFridgeCreated={isFridgeCreated}
            currentStep={homeStep}
            onSelectStep={setHomeStep}
            onBuildFridge={handleBuildFridge}
            catalogItems={catalogItems}
            selectedItemIds={selectedItemIds}
            onToggleCatalogItem={handleToggleCatalogItem}
            onIncrementCatalogItem={handleIncrementCatalogItem}
            onDecrementCatalogItem={handleDecrementCatalogItem}
            onSelectAllItems={handleSelectAllItems}
            onDeselectAllItems={handleDeselectAllItems}
            onConfirmSelection={handleConfirmSelection}
            onBackToFridgeName={() => setHomeStep('build_fridge')}
            ingredients={ingredients}
            onIncrementIngredient={handleIncrementIngredient}
            onDecrementIngredient={handleDecrementIngredient}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            currentRecommendation={currentRecommendation}
            onNextRecipe={handleNextRecipe}
            onViewInstructions={(r) => setSelectedRecipeModal(r)}
            onResetFridge={handleResetFridge}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {currentTab === 'cooking' && (
          <CookingScreen
            recipes={RECIPES}
            inventory={ingredients}
            onViewInstructions={(r) => setSelectedRecipeModal(r)}
          />
        )}

        {currentTab === 'recipes' && (
          <RecipesScreen
            recipes={RECIPES}
            onViewInstructions={(r) => setSelectedRecipeModal(r)}
          />
        )}
      </View>

      {/* Fixed Bottom Navigation Bar */}
      <RetroTabBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        bottomInset={insets.bottom}
      />

      {/* Authentication Modal */}
      <AuthModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={isProfileModalOpen}
        user={currentUser}
        fridgeName={fridgeName}
        itemsCount={ingredients.length}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Add Food Modal */}
      <AddIngredientModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomIngredient}
      />

      {/* Recipe Instructions Modal */}
      <RecipeDetailsModal
        recipe={selectedRecipeModal}
        visible={selectedRecipeModal !== null}
        inventory={ingredients}
        onClose={() => setSelectedRecipeModal(null)}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    Vazirmatn_900Black,
  });

  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mainArea: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    backgroundColor: COLORS.yellow,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...RETRO_SHADOW.md,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
});
