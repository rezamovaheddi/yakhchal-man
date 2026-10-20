import React from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { Ingredient, Recipe, UserAccount, WasteTrackingStats } from '../types';
import { HeaderBar } from '../components/home/HeaderBar';
import { StepWizardBar, HomeStep } from '../components/home/StepWizardBar';
import { FridgeCreationStep } from '../components/home/FridgeCreationStep';
import { ItemSelectionStep } from '../components/home/ItemSelectionStep';
import { FeaturedRecipeCard } from '../components/home/FeaturedRecipeCard';
import { InventorySection } from '../components/home/InventorySection';
import { UrgentIngredientsSection } from '../components/antiwaste/UrgentIngredientsSection';
import { WasteSavingsCard } from '../components/antiwaste/WasteSavingsCard';
import { RecipeAvailabilityResult, getSmartRecipeSummary } from '../utils/recipeEngine';
import { RECIPES } from '../constants/initialData';
import { COLORS, BORDER, RETRO_SHADOW } from '../constants/theme';
import { toPersianDigits } from '../utils/persian';
import {
  RetroSnowflakeIcon,
  RetroEditIcon,
  RetroRefreshIcon,
  RetroBulbIcon,
  RetroSparkleIcon,
} from '../components/icons/RetroIcons';

interface HomeScreenProps {
  fridgeName: string;
  isFridgeCreated: boolean;
  currentStep: HomeStep;
  onSelectStep: (step: HomeStep) => void;
  onBuildFridge: (name: string, model: string) => void;
  catalogItems: Ingredient[];
  selectedItemIds: Set<string>;
  onToggleCatalogItem: (id: string) => void;
  onIncrementCatalogItem: (id: string) => void;
  onDecrementCatalogItem: (id: string) => void;
  onSelectAllItems: () => void;
  onDeselectAllItems: () => void;
  onConfirmSelection: () => void;
  onBackToFridgeName: () => void;
  ingredients: Ingredient[];
  onIncrementIngredient: (id: string) => void;
  onDecrementIngredient: (id: string) => void;
  onOpenAddModal: () => void;
  currentRecommendation: RecipeAvailabilityResult;
  onNextRecipe: () => void;
  onViewInstructions: (recipe: Recipe) => void;
  onResetFridge: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onCheckUpdates?: () => void;
  hasUpdate?: boolean;
  antiWasteStats?: WasteTrackingStats;
  onConsumeItem?: (id: string) => void;
  onWasteItem?: (id: string) => void;
  onNavigateToCooking?: () => void;
  onOpenAiChef?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  fridgeName,
  isFridgeCreated,
  currentStep,
  onSelectStep,
  onBuildFridge,
  catalogItems,
  selectedItemIds,
  onToggleCatalogItem,
  onIncrementCatalogItem,
  onDecrementCatalogItem,
  onSelectAllItems,
  onDeselectAllItems,
  onConfirmSelection,
  onBackToFridgeName,
  ingredients,
  onIncrementIngredient,
  onDecrementIngredient,
  onOpenAddModal,
  currentRecommendation,
  onNextRecipe,
  onViewInstructions,
  onResetFridge,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onCheckUpdates,
  hasUpdate,
  antiWasteStats,
  onConsumeItem,
  onWasteItem,
  onNavigateToCooking,
  onOpenAiChef,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Retro Header with Logo & Tagline */}
      <HeaderBar
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
        onCheckUpdates={onCheckUpdates}
        hasUpdate={hasUpdate}
      />

      {/* 3-Step Wizard Navigation */}
      <StepWizardBar
        currentStep={currentStep}
        onSelectStep={onSelectStep}
        isFridgeCreated={isFridgeCreated}
        selectedItemsCount={selectedItemIds.size}
      />

      {/* Step 1: Create / Build Fridge */}
      {currentStep === 'build_fridge' && (
        <FridgeCreationStep
          currentName={fridgeName}
          onBuildFridge={onBuildFridge}
          isAlreadyCreated={isFridgeCreated}
          onNextStep={() => onSelectStep('select_items')}
        />
      )}

      {/* Step 2: Select Items in Fridge */}
      {currentStep === 'select_items' && (
        <ItemSelectionStep
          fridgeName={fridgeName}
          catalogItems={catalogItems}
          selectedItemIds={selectedItemIds}
          onToggleItem={onToggleCatalogItem}
          onIncrementQuantity={onIncrementCatalogItem}
          onDecrementQuantity={onDecrementCatalogItem}
          onSelectAll={onSelectAllItems}
          onDeselectAll={onDeselectAllItems}
          onOpenAddModal={onOpenAddModal}
          onConfirmSelection={onConfirmSelection}
          onBackToFridgeName={onBackToFridgeName}
        />
      )}

      {/* Step 3: Suggest Recipe & Display Items right there */}
      {currentStep === 'suggestion_and_items' && (
        <View style={styles.resultsContainer}>
          {/* Active Fridge Status Ribbon */}
          <View style={styles.fridgeRibbon}>
            <View style={styles.ribbonInfo}>
              <View style={styles.ribbonTitleRow}>
                <RetroSnowflakeIcon size={18} color={COLORS.orange} />
                <Text style={styles.ribbonTitle}>{fridgeName}</Text>
              </View>
              <Text style={styles.ribbonMeta}>
                {toPersianDigits(ingredients.length)} قلم کالا در یخچال موجود است
              </Text>
            </View>

            <View style={styles.ribbonActions}>
              <Pressable
                onPress={() => onSelectStep('select_items')}
                style={styles.ribbonBtn}
              >
                <View style={styles.btnContentRow}>
                  <RetroEditIcon size={13} color={COLORS.black} />
                  <Text style={styles.ribbonBtnText}>ویرایش اقلام</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={onResetFridge}
                style={[styles.ribbonBtn, styles.ribbonResetBtn]}
              >
                <View style={styles.btnContentRow}>
                  <RetroRefreshIcon size={13} color={COLORS.black} />
                  <Text style={styles.ribbonBtnText}>یخچال جدید</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* AI Chef LLM Action Banner */}
          {onOpenAiChef && (
            <Pressable
              onPress={onOpenAiChef}
              style={({ pressed }) => [
                styles.aiChefCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.aiChefInner}>
                <View style={styles.aiChefIconWrap}>
                  <Text style={styles.aiChefEmoji}>🤖</Text>
                </View>
                <View style={styles.aiChefContent}>
                  <View style={styles.aiChefTitleRow}>
                    <Text style={styles.aiChefTitle}>سرآشپز هوش مصنوعی (LLM)</Text>
                    <View style={styles.aiChefBadge}>
                      <Text style={styles.aiChefBadgeText}>۳ پیشنهاد ویژه</Text>
                    </View>
                  </View>
                  <Text style={styles.aiChefSubtitle}>
                    پیشنهاد اختصاصی ۳ غذا بر اساس موجودی یخچال شما ✨
                  </Text>
                </View>
                <RetroSparkleIcon size={20} color={COLORS.orangeDark} />
              </View>
            </Pressable>
          )}

          {/* Smart Food Suggestion Summary Banner */}
          <View style={styles.smartSummaryCard}>
            <View style={styles.smartSummaryRow}>
              <RetroBulbIcon size={18} color={COLORS.orange} />
              <Text style={styles.smartSummaryText}>
                {getSmartRecipeSummary(RECIPES, ingredients)}
              </Text>
            </View>
          </View>

          {/* Smart Anti-Waste: Urgent Shelf ("اول این مواد را مصرف کن") */}
          <UrgentIngredientsSection
            inventory={ingredients}
            onConsumeItem={onConsumeItem ?? (() => {})}
            onWasteItem={onWasteItem ?? (() => {})}
            onCookWithUrgent={onNavigateToCooking ?? (() => {})}
          />

          {/* Smart Anti-Waste: Monthly Savings & Waste Calculator */}
          <WasteSavingsCard stats={antiWasteStats} />

          {/* Part A: Suggested Recipe based on Selected Items & Expiring Foods */}
          <FeaturedRecipeCard
            availabilityResult={currentRecommendation}
            onNextRecipe={onNextRecipe}
            onViewInstructions={onViewInstructions}
          />

          {/* Part B: Display Item List with Location & Expiry Badges */}
          <InventorySection
            ingredients={ingredients}
            onIncrement={onIncrementIngredient}
            onDecrement={onDecrementIngredient}
            onOpenAddModal={onOpenAddModal}
            onEditSelection={() => onSelectStep('select_items')}
            fridgeName={fridgeName}
            onConsumeItem={onConsumeItem}
            onWasteItem={onWasteItem}
          />
        </View>
      )}
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
  resultsContainer: {
    gap: 12,
  },
  fridgeRibbon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    ...RETRO_SHADOW.sm,
  },
  ribbonInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  ribbonTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ribbonTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.black,
  },
  ribbonMeta: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontWeight: '600',
  },
  ribbonActions: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  ribbonBtn: {
    backgroundColor: COLORS.yellow,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    ...RETRO_SHADOW.sm,
  },
  btnContentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  ribbonResetBtn: {
    backgroundColor: COLORS.cream,
  },
  ribbonBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
  },
  smartSummaryCard: {
    backgroundColor: '#FFF2C6',
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    ...RETRO_SHADOW.sm,
  },
  smartSummaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  smartSummaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'right',
    lineHeight: 18,
  },
  aiChefCard: {
    backgroundColor: '#FFE8D6',
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    ...RETRO_SHADOW.md,
  },
  aiChefInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  aiChefIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.thin,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiChefEmoji: {
    fontSize: 22,
  },
  aiChefContent: {
    flex: 1,
  },
  aiChefTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  aiChefTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.black,
  },
  aiChefBadge: {
    backgroundColor: COLORS.yellow,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  aiChefBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
  },
  aiChefSubtitle: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
});
