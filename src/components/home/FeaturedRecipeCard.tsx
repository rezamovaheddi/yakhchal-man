import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recipe } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { RetroProgressBar } from '../common/RetroProgressBar';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { RetroClockIcon } from '../icons/RetroIcons';
import { RecipeAvailabilityResult } from '../../utils/recipeEngine';
import { toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface FeaturedRecipeCardProps {
  availabilityResult: RecipeAvailabilityResult;
  onNextRecipe: () => void;
  onViewInstructions: (recipe: Recipe) => void;
}

export const FeaturedRecipeCard: React.FC<FeaturedRecipeCardProps> = ({
  availabilityResult,
  onNextRecipe,
  onViewInstructions,
}) => {
  const { recipe, totalRequired, availableCount, percentage, isFullyAvailable } =
    availabilityResult;

  return (
    <RetroWindow title="امروز چی بپزم؟" subtitle="پیشنهاد هوشمند سرآشپز">
      {/* Featured Dish Banner */}
      <View style={styles.dishBanner}>
        {/* Large appetizing food illustration */}
        <View style={styles.dishIllustrationBox}>
          <FoodIconRenderer iconName={recipe.iconName} size={64} />
          {isFullyAvailable ? (
            <View style={styles.readyTag}>
              <Text style={styles.readyTagText}>آماده پخت! ✨</Text>
            </View>
          ) : null}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoCol}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.recipeDesc}>{recipe.description}</Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <RetroBadge
              label={`زمان: ${recipe.prepTime}`}
              color={COLORS.cream}
              icon={<RetroClockIcon size={14} color={COLORS.black} />}
            />
            <RetroBadge
              label={`سطح: ${recipe.difficulty}`}
              color={COLORS.yellow}
            />
          </View>
        </View>
      </View>

      {/* Retro Inset Availability Section with Progress Bar */}
      <View style={styles.availabilityBox}>
        <View style={styles.availabilityHeader}>
          <Text style={styles.availabilityLabel}>
            وضعیت موجودی مواد در یخچال:
          </Text>
          <Text style={styles.availabilityCount}>
            {toPersianDigits(availableCount)} از {toPersianDigits(totalRequired)} ماده ({toPersianDigits(percentage)}٪)
          </Text>
        </View>

        {/* Vintage Windows copy-dialog style segmented progress bar */}
        <RetroProgressBar percentage={percentage} blockColor={COLORS.lavender} />

        {/* Missing ingredients notice if any */}
        {availabilityResult.missingIngredients.length > 0 && (
          <View style={styles.missingNotice}>
            <Text style={styles.missingText}>
              کسری: {availabilityResult.missingIngredients.join('، ')}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.buttonsRow}>
        <RetroButton
          label="پیشنهاد غذای دیگه"
          variant="primary"
          onPress={onNextRecipe}
          size="md"
          style={styles.primaryBtn}
        />
        <RetroButton
          label="مشاهده دستور پخت"
          variant="secondary"
          onPress={() => onViewInstructions(recipe)}
          size="md"
          style={styles.secondaryBtn}
        />
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  dishBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dishIllustrationBox: {
    width: 90,
    height: 90,
    borderRadius: BORDER.radiusSm,
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...RETRO_SHADOW.sm,
  },
  readyTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: COLORS.green,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  readyTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
  },
  infoCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    flexWrap: 'wrap',
  },
  availabilityBox: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 12,
  },
  availabilityHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  availabilityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  availabilityCount: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
  },
  missingNotice: {
    marginTop: 6,
  },
  missingText: {
    fontSize: 11,
    color: '#A83B3B',
    fontWeight: '600',
    textAlign: 'right',
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  primaryBtn: {
    flex: 1.2,
  },
  secondaryBtn: {
    flex: 1,
  },
});
