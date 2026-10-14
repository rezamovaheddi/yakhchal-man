import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ingredient, Recipe } from '../types';
import { HeaderBar } from '../components/home/HeaderBar';
import { FridgeNameForm } from '../components/home/FridgeNameForm';
import { InventorySection } from '../components/home/InventorySection';
import { FeaturedRecipeCard } from '../components/home/FeaturedRecipeCard';
import { RecipeAvailabilityResult } from '../utils/recipeEngine';

interface HomeScreenProps {
  fridgeName: string;
  onSaveFridgeName: (name: string) => void;
  ingredients: Ingredient[];
  onIncrementIngredient: (id: string) => void;
  onDecrementIngredient: (id: string) => void;
  onOpenAddModal: () => void;
  currentRecommendation: RecipeAvailabilityResult;
  onNextRecipe: () => void;
  onViewInstructions: (recipe: Recipe) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  fridgeName,
  onSaveFridgeName,
  ingredients,
  onIncrementIngredient,
  onDecrementIngredient,
  onOpenAddModal,
  currentRecommendation,
  onNextRecipe,
  onViewInstructions,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Section A: Retro Header with Logo & Tagline */}
      <HeaderBar />

      {/* Section B: Refrigerator Name Form */}
      <FridgeNameForm
        currentName={fridgeName}
        onSaveName={onSaveFridgeName}
      />

      {/* Section C: Refrigerator Inventory Grid */}
      <InventorySection
        ingredients={ingredients}
        onIncrement={onIncrementIngredient}
        onDecrement={onDecrementIngredient}
        onOpenAddModal={onOpenAddModal}
      />

      {/* Section D: Featured Recipe Recommendation */}
      <FeaturedRecipeCard
        availabilityResult={currentRecommendation}
        onNextRecipe={onNextRecipe}
        onViewInstructions={onViewInstructions}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
});
