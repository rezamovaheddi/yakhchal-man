import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  I18nManager,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
  Vazirmatn_900Black,
} from '@expo-google-fonts/vazirmatn';

import { Ingredient, Recipe, TabType, ToastMessage } from './src/types';
import { INITIAL_INGREDIENTS, RECIPES } from './src/constants/initialData';
import { COLORS, BORDER, RETRO_SHADOW } from './src/constants/theme';
import { checkRecipeAvailability, rankRecipesByAvailability } from './src/utils/recipeEngine';

import { HomeScreen } from './src/screens/HomeScreen';
import { CookingScreen } from './src/screens/CookingScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { RetroTabBar } from './src/components/navigation/RetroTabBar';
import { AddIngredientModal } from './src/components/modals/AddIngredientModal';
import { RecipeDetailsModal } from './src/components/modals/RecipeDetailsModal';

// Enable RTL layout
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch (e) {
    console.warn('RTL error:', e);
  }
}

function MainApp() {
  const insets = useSafeAreaInsets();

  // App States
  const [fridgeName, setFridgeName] = useState('یخچال خونه ما');
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [recommendedRecipeIndex, setRecommendedRecipeIndex] = useState(0);

  // Modals & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Show Toast helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  // Ingredient Handlers
  const handleIncrement = (id: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      )
    );
  };

  const handleAddIngredient = (newItem: Omit<Ingredient, 'id'>) => {
    const newId = `ing-${Date.now()}`;
    setIngredients((prev) => [
      {
        ...newItem,
        id: newId,
      },
      ...prev,
    ]);
    showToast(`«${newItem.name}» به موجودی یخچال اضافه شد! 🎉`);
  };

  const handleSaveFridgeName = (name: string) => {
    setFridgeName(name);
    showToast(`نام یخچال به «${name}» تغییر یافت! ✨`);
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
            onSaveFridgeName={handleSaveFridgeName}
            ingredients={ingredients}
            onIncrementIngredient={handleIncrement}
            onDecrementIngredient={handleDecrement}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            currentRecommendation={currentRecommendation}
            onNextRecipe={handleNextRecipe}
            onViewInstructions={(r) => setSelectedRecipeModal(r)}
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

      {/* Add Food Modal */}
      <AddIngredientModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddIngredient}
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
