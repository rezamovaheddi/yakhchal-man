import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ingredient, Recipe } from '../types';
import { RetroWindow } from '../components/common/RetroWindow';
import { RetroButton } from '../components/common/RetroButton';
import { RetroBadge } from '../components/common/RetroBadge';
import { RetroProgressBar } from '../components/common/RetroProgressBar';
import { FoodIconRenderer } from '../components/icons/FoodIcons';
import { RetroClockIcon } from '../components/icons/RetroIcons';
import {
  rankRecipesByScore,
  MealFilter,
  recipeMatchesFilter,
  suggestSubstitutes,
  countExpiringIngredientsInRecipe,
} from '../utils/recipeEngine';
import { toPersianDigits } from '../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../constants/theme';

interface CookingScreenProps {
  recipes: Recipe[];
  inventory: Ingredient[];
  onViewInstructions: (recipe: Recipe) => void;
}

const MEAL_TABS: Array<{ id: MealFilter; label: string }> = [
  { id: 'همه', label: 'همه' },
  { id: 'صبحانه', label: 'صبحانه' },
  { id: 'ناهار_شام', label: 'ناهار و شام' },
  { id: 'دسر', label: 'دسر و عصرانه' },
  { id: 'اقتصادی', label: 'کم‌هزینه' },
];

export const CookingScreen: React.FC<CookingScreenProps> = ({
  recipes,
  inventory,
  onViewInstructions,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'available'>('all');
  const [mealFilter, setMealFilter] = useState<MealFilter>('همه');

  // Rank all recipes by availability + prep time + difficulty
  const ranked = rankRecipesByScore(recipes, inventory);

  // Apply meal category filter
  const categoryFiltered = ranked.filter((item) => recipeMatchesFilter(item, mealFilter));

  // Apply availability toggle
  const filtered = filterMode === 'available'
    ? categoryFiltered.filter((item) => item.isFullyAvailable)
    : categoryFiltered;

  const readyCount = ranked.filter((e) => e.isFullyAvailable).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <RetroWindow
        title="آشپزخانه هوشمند"
        subtitle="پیشنهاد بر اساس مواد، زمان و سختی"
      >
        {/* Readiness Summary Banner */}
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryBannerText}>
            🍳 {readyCount > 0
              ? `همین الان می‌توانید ${toPersianDigits(readyCount)} غذا بپزید!`
              : 'برای پخت کامل، برخی اقلام را تهیه یا جایگزین کنید.'}
          </Text>
        </View>

        {/* Filter Switcher: All vs Ready-now */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilterMode('all')}
            style={[
              styles.filterBtn,
              filterMode === 'all' && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterMode === 'all' && styles.filterBtnTextActive,
              ]}
            >
              همه ({toPersianDigits(categoryFiltered.length)})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterMode('available')}
            style={[
              styles.filterBtn,
              filterMode === 'available' && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterMode === 'available' && styles.filterBtnTextActive,
              ]}
            >
              آماده پخت ({toPersianDigits(categoryFiltered.filter((e) => e.isFullyAvailable).length)}) ✨
            </Text>
          </Pressable>
        </View>

        {/* Meal Category Filters: صبحانه، ناهار و شام، دسر، اقتصادی */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealFilterScroll}
          style={styles.mealFilterScrollContainer}
        >
          {MEAL_TABS.map((tab) => {
            const isSelected = mealFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setMealFilter(tab.id)}
                style={[
                  styles.mealTabBtn,
                  isSelected && styles.mealTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.mealTabBtnText,
                    isSelected && styles.mealTabBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* List of recipe cards */}
        <View style={styles.recipesList}>
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>هیچ غذایی با این فیلتر یافت نشد!</Text>
              <Text style={styles.emptyDesc}>
                فیلتر دیگری را انتخاب کنید یا از صفحه اصلی، مواد جدیدی به یخچال اضافه فرمایید.
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const { recipe, percentage, isFullyAvailable, availableCount, totalRequired, missingIngredients } = item;
              const substitutes = suggestSubstitutes(missingIngredients);

              return (
                <View key={recipe.id} style={styles.recipeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <FoodIconRenderer iconName={recipe.iconName} size={36} />
                    </View>
                    <View style={styles.headerInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        {isFullyAvailable ? (
                          <RetroBadge
                            label="قابل پخت الان!"
                            color={COLORS.green}
                          />
                        ) : missingIngredients.length === 1 ? (
                          <RetroBadge
                            label="فقط ۱ کسری!"
                            color={COLORS.yellow}
                          />
                        ) : null}
                        {countExpiringIngredientsInRecipe(recipe, inventory) > 0 ? (
                          <RetroBadge
                            label={`🚨 نجات ${toPersianDigits(countExpiringIngredientsInRecipe(recipe, inventory))} قلم در معرض انقضا`}
                            color="#FFCCBC"
                          />
                        ) : null}
                      </View>
                      <Text style={styles.recipeCategory}>{recipe.category}</Text>
                    </View>
                  </View>

                  <Text style={styles.recipeDescription}>{recipe.description}</Text>

                  {/* Progress Indicator */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>
                        موجودی مواد: {toPersianDigits(availableCount)} از {toPersianDigits(totalRequired)}
                      </Text>
                      <Text style={styles.percentageText}>
                        {toPersianDigits(percentage)}٪
                      </Text>
                    </View>
                    <RetroProgressBar percentage={percentage} />
                  </View>

                  {/* Missing ingredients or Substitutes Alert */}
                  {!isFullyAvailable && missingIngredients.length > 0 && (
                    <View style={styles.missingBox}>
                      <Text style={styles.missingTitle}>
                        ❌ کسری مواد: {missingIngredients.join('، ')}
                      </Text>
                      {substitutes.length > 0 && (
                        <Text style={styles.substituteHint}>
                          💡 جایگزین: {substitutes[0].missing} ← {substitutes[0].substitutes[0]}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Badges and Action */}
                  <View style={styles.cardFooter}>
                    <View style={styles.badges}>
                      <RetroBadge
                        label={recipe.prepTime}
                        color={COLORS.cream}
                        icon={<RetroClockIcon size={12} />}
                      />
                      <RetroBadge
                        label={recipe.difficulty}
                        color={COLORS.yellow}
                      />
                    </View>
                    <RetroButton
                      label="دستور پخت"
                      variant="primary"
                      onPress={() => onViewInstructions(recipe)}
                      size="sm"
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </RetroWindow>
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
  filterRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    ...RETRO_SHADOW.sm,
  },
  filterBtnActive: {
    backgroundColor: COLORS.yellow,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  filterBtnTextActive: {
    fontWeight: '900',
  },
  recipesList: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    ...RETRO_SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'right',
  },
  recipeCategory: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'right',
    marginTop: 2,
  },
  recipeDescription: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBE3DA',
  },
  badges: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  summaryBanner: {
    backgroundColor: '#FFF2C6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    ...RETRO_SHADOW.sm,
  },
  summaryBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  mealFilterScrollContainer: {
    marginBottom: 12,
  },
  mealFilterScroll: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingHorizontal: 2,
  },
  mealTabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
  },
  mealTabBtnActive: {
    backgroundColor: COLORS.orange,
  },
  mealTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  mealTabBtnTextActive: {
    fontWeight: '900',
    color: COLORS.white,
  },
  missingBox: {
    backgroundColor: '#FFEAEA',
    borderWidth: 1,
    borderColor: '#E85D54',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    gap: 3,
  },
  missingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A82820',
    textAlign: 'right',
  },
  substituteHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E5016',
    textAlign: 'right',
  },
});
