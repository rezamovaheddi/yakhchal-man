import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ingredient, Recipe } from '../types';
import { RetroWindow } from '../components/common/RetroWindow';
import { RetroButton } from '../components/common/RetroButton';
import { RetroBadge } from '../components/common/RetroBadge';
import { RetroProgressBar } from '../components/common/RetroProgressBar';
import { FoodIconRenderer } from '../components/icons/FoodIcons';
import {
  RetroClockIcon,
  RetroSparkleIcon,
  RetroBulbIcon,
  RetroAlarmLightIcon,
} from '../components/icons/RetroIcons';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  onOpenAiChef?: () => void;
}

const MEAL_TABS: Array<{
  id: MealFilter;
  label: string;
  icon: (color: string) => React.ReactNode;
}> = [
  {
    id: 'همه',
    label: 'همه',
    icon: (color) => <Ionicons name="apps-outline" size={13} color={color} />,
  },
  {
    id: 'صبحانه',
    label: 'صبحانه',
    icon: (color) => <MaterialCommunityIcons name="weather-sunset-up" size={14} color={color} />,
  },
  {
    id: 'ناهار_شام',
    label: 'ناهار و شام',
    icon: (color) => <MaterialCommunityIcons name="weather-sunny" size={14} color={color} />,
  },
  {
    id: 'دسر',
    label: 'دسر و عصرانه',
    icon: (color) => <MaterialCommunityIcons name="coffee-outline" size={14} color={color} />,
  },
  {
    id: 'اقتصادی',
    label: 'کم‌هزینه',
    icon: (color) => <MaterialCommunityIcons name="piggy-bank-outline" size={14} color={color} />,
  },
];

export const CookingScreen: React.FC<CookingScreenProps> = ({
  recipes,
  inventory,
  onViewInstructions,
  onOpenAiChef,
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
          <View style={styles.summaryBannerRow}>
            <MaterialCommunityIcons name="pot-steam" size={20} color={COLORS.orange} />
            <Text style={styles.summaryBannerText}>
              {readyCount > 0
                ? `همین الان می‌توانید ${toPersianDigits(readyCount)} غذا بپزید!`
                : 'برای پخت کامل، برخی اقلام را تهیه یا جایگزین کنید.'}
            </Text>
          </View>
        </View>

        {/* AI Chef Banner */}
        {onOpenAiChef && (
          <Pressable
            onPress={onOpenAiChef}
            style={({ pressed }) => [
              styles.aiChefBar,
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={styles.aiChefBarInner}>
              <View style={styles.aiChefBarRight}>
                <Text style={styles.aiChefBarEmoji}>🤖</Text>
                <View>
                  <Text style={styles.aiChefBarTitle}>سرآشپز هوش مصنوعی (LLM)</Text>
                  <Text style={styles.aiChefBarSub}>۳ پیشنهاد خلاقانه بر اساس مواد موجود در یخچال</Text>
                </View>
              </View>
              <View style={styles.aiChefBarBtn}>
                <Text style={styles.aiChefBarBtnText}>مشاهده ✨</Text>
              </View>
            </View>
          </Pressable>
        )}

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
            <View style={styles.filterBtnContent}>
              <Text
                style={[
                  styles.filterBtnText,
                  filterMode === 'available' && styles.filterBtnTextActive,
                ]}
              >
                آماده پخت ({toPersianDigits(categoryFiltered.filter((e) => e.isFullyAvailable).length)})
              </Text>
              <RetroSparkleIcon size={13} color={COLORS.orange} />
            </View>
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
            const iconColor = isSelected ? COLORS.black : COLORS.grayDark;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setMealFilter(tab.id)}
                style={[
                  styles.mealTabBtn,
                  isSelected && styles.mealTabBtnActive,
                ]}
              >
                <View style={styles.mealTabContent}>
                  {tab.icon(iconColor)}
                  <Text
                    style={[
                      styles.mealTabBtnText,
                      isSelected && styles.mealTabBtnTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
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
                            label={`نجات ${toPersianDigits(countExpiringIngredientsInRecipe(recipe, inventory))} قلم در معرض انقضا`}
                            color="#FFCCBC"
                            icon={<RetroAlarmLightIcon size={12} color="#D9381E" />}
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
                      <View style={styles.missingRow}>
                        <Ionicons name="close-circle" size={14} color="#D9381E" />
                        <Text style={styles.missingTitle}>
                          کسری مواد: {missingIngredients.join('، ')}
                        </Text>
                      </View>
                      {substitutes.length > 0 && (
                        <View style={styles.substituteRow}>
                          <RetroBulbIcon size={14} color={COLORS.orange} />
                          <Text style={styles.substituteHint}>
                            جایگزین: {substitutes[0].missing} ← {substitutes[0].substitutes[0]}
                          </Text>
                        </View>
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
                      icon={<RetroClockIcon size={13} color={COLORS.black} />}
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
  summaryBannerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  filterBtnContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
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
  mealTabContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
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
  missingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  missingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A82820',
    textAlign: 'right',
  },
  substituteRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  substituteHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E5016',
    textAlign: 'right',
  },
  aiChefBar: {
    backgroundColor: '#FFF2C6',
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    marginBottom: 10,
    ...RETRO_SHADOW.sm,
  },
  aiChefBarInner: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiChefBarRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  aiChefBarEmoji: {
    fontSize: 20,
  },
  aiChefBarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'right',
  },
  aiChefBarSub: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  aiChefBarBtn: {
    backgroundColor: COLORS.orange,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...RETRO_SHADOW.sm,
  },
  aiChefBarBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
});
