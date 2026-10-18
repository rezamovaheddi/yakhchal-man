import React, { useState, useEffect } from 'react';
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

import { Ingredient, Recipe, TabType, ToastMessage, UserAccount } from './src/types';
import { RECIPES, CATALOG_INGREDIENTS } from './src/constants/initialData';
import { COLORS, BORDER, RETRO_SHADOW } from './src/constants/theme';
import { checkRecipeAvailability, rankRecipesByAvailability } from './src/utils/recipeEngine';
import { authStorage } from './src/utils/authStorage';

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

function MainApp() {
  const insets = useSafeAreaInsets();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // App & Wizard States
  const [fridgeName, setFridgeName] = useState('یخچال خونه ما');
  const [isFridgeCreated, setIsFridgeCreated] = useState(false);
  const [homeStep, setHomeStep] = useState<HomeStep>('build_fridge');

  // Catalog & Inventory States
  const [catalogItems, setCatalogItems] = useState<Ingredient[]>(INITIAL_CATALOG);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Navigation & Suggestions
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [recommendedRecipeIndex, setRecommendedRecipeIndex] = useState(0);

  // Modals & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load existing session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await authStorage.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (user.fridgeName) {
            setFridgeName(user.fridgeName);
          }
        }
      } catch (e) {
        console.warn('Failed to load session:', e);
      }
    };
    loadSession();
  }, []);

  // Show Toast helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  // Auth Handlers
  const handleAuthSuccess = (user: UserAccount, mode: 'login' | 'register') => {
    setCurrentUser(user);
    if (user.fridgeName) {
      setFridgeName(user.fridgeName);
    }
    if (mode === 'register') {
      showToast(`خوش آمدید، ${user.name}! حساب کاربری شما ساخته شد. 🎉`);
    } else {
      showToast(`خوش آمدید، ${user.name}! با موفقیت وارد شدید. 🔑`);
    }
  };

  const handleLogout = async () => {
    await authStorage.logout();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    showToast('با موفقیت از حساب کاربری خارج شدید. 🚪', 'info');
  };

  const handleSwitchAccount = () => {
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(true);
  };

  // Step 1: Fridge Creation
  const handleBuildFridge = (name: string, model: string) => {
    setFridgeName(name);
    setIsFridgeCreated(true);
    setHomeStep('select_items');
    showToast(`یخچال «${name}» با موفقیت راه‌اندازی شد! حالا اقلام را انتخاب کنید ❄️`);
  };

  const handleResetFridge = () => {
    setIsFridgeCreated(false);
    setHomeStep('build_fridge');
    showToast('یخچال ریست شد. نام و مشخصات جدید را وارد کنید.', 'info');
  };

  // Step 2: Item Selection
  const handleToggleCatalogItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleIncrementCatalogItem = (id: string) => {
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
    setSelectedItemIds((prev) => new Set(prev).add(id));
  };

  const handleDecrementCatalogItem = (id: string) => {
    setCatalogItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  };

  const handleSelectAllItems = () => {
    setSelectedItemIds(new Set(catalogItems.map((item) => item.id)));
  };

  const handleDeselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  const handleConfirmSelection = () => {
    if (selectedItemIds.size === 0) {
      showToast('لطفاً حداقل یک قلم کالا برای یخچال انتخاب کنید! ⚠️', 'warning');
      return;
    }
    const chosen = catalogItems.filter((item) => selectedItemIds.has(item.id));
    setIngredients(chosen);
    setRecommendedRecipeIndex(0);
    setHomeStep('suggestion_and_items');
    showToast('پیشنهاد غذا بر اساس اقلام انتخابی شما آماده شد! 🍳', 'success');
  };

  // Step 3: Inventory Handlers (live updates to recipe availability)
  const handleIncrementIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const handleDecrementIngredient = (id: string) => {
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
  };

  const handleAddCustomIngredient = (newItem: Omit<Ingredient, 'id'>) => {
    const newId = `ing-${Date.now()}`;
    const fullItem: Ingredient = {
      ...newItem,
      id: newId,
    };
    setCatalogItems((prev) => [fullItem, ...prev]);
    setSelectedItemIds((prev) => new Set(prev).add(newId));
    setIngredients((prev) => [fullItem, ...prev]);
    showToast(`«${newItem.name}» به موجودی یخچال اضافه شد! 🎉`);
  };

  // Recipe Suggestions logic
  const rankedRecipes = rankRecipesByAvailability(RECIPES, ingredients);
  const currentRecommendation =
    rankedRecipes[recommendedRecipeIndex % rankedRecipes.length] ||
    checkRecipeAvailability(RECIPES[0], ingredients);

  const handleNextRecipe = () => {
    setRecommendedRecipeIndex((prev) => (prev + 1) % RECIPES.length);
    showToast('پیشنهاد غذای بعدی بارگذاری شد! 🍽️', 'info');
  };

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
