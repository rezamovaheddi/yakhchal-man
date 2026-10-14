import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ingredient, Recipe } from '../types';
import { RetroWindow } from '../components/common/RetroWindow';
import { RetroButton } from '../components/common/RetroButton';
import { RetroBadge } from '../components/common/RetroBadge';
import { RetroProgressBar } from '../components/common/RetroProgressBar';
import { FoodIconRenderer } from '../components/icons/FoodIcons';
import { RetroClockIcon } from '../components/icons/RetroIcons';
import { checkRecipeAvailability } from '../utils/recipeEngine';
import { toPersianDigits } from '../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../constants/theme';

interface CookingScreenProps {
  recipes: Recipe[];
  inventory: Ingredient[];
  onViewInstructions: (recipe: Recipe) => void;
}

export const CookingScreen: React.FC<CookingScreenProps> = ({
  recipes,
  inventory,
  onViewInstructions,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'available'>('all');

  const evaluated = recipes.map((r) => checkRecipeAvailability(r, inventory));
  const filtered = filterMode === 'available'
    ? evaluated.filter((item) => item.isFullyAvailable)
    : evaluated;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <RetroWindow
        title="آشپزخانه و کشف دستور پخت"
        subtitle="پیشنهاد بر اساس مواد موجود"
      >
        {/* Filter Switcher */}
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
              همه غذاها ({toPersianDigits(evaluated.length)})
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
              قابل پخت الان ({toPersianDigits(evaluated.filter((e) => e.isFullyAvailable).length)})
            </Text>
          </Pressable>
        </View>

        {/* List of recipe cards */}
        <View style={styles.recipesList}>
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>هیچ غذایی با موجودی فعلی یافت نشد!</Text>
              <Text style={styles.emptyDesc}>
                می‌توانید از تب «خانه»، مواد غذایی جدید به یخچال اضافه کنید.
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const { recipe, percentage, isFullyAvailable, availableCount, totalRequired } = item;
              return (
                <View key={recipe.id} style={styles.recipeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <FoodIconRenderer iconName={recipe.iconName} size={36} />
                    </View>
                    <View style={styles.headerInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        {isFullyAvailable && (
                          <RetroBadge
                            label="آماده پخت!"
                            color={COLORS.green}
                          />
                        )}
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
                      label="مشاهده دستور پخت"
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
});
