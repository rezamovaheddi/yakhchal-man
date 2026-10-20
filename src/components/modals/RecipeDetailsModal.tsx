import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ingredient, Recipe } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { FoodIconRenderer } from '../icons/FoodIcons';
import {
  RetroClockIcon,
  RetroRemoveIcon,
  RetroAddIcon,
  RetroBulbIcon,
  RetroSpeedometerIcon,
  RetroCloseIcon,
} from '../icons/RetroIcons';
import { Ionicons } from '@expo/vector-icons';
import { formatQuantity, toPersianDigits } from '../../utils/persian';
import { normalizePersianName, suggestSubstitutes } from '../../utils/recipeEngine';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface RecipeDetailsModalProps {
  recipe: Recipe | null;
  visible: boolean;
  inventory: Ingredient[];
  onClose: () => void;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({
  recipe,
  visible,
  inventory,
  onClose,
}) => {
  const [servings, setServings] = useState<number>(2);

  if (!recipe) return null;

  // Calculate missing ingredients for substitute suggestions
  const missingList: string[] = [];
  recipe.ingredients.forEach((req) => {
    const scaledQty = Math.max(1, Math.ceil(req.requiredQuantity * (servings / 2)));
    const found = inventory.find(
      (item) => normalizePersianName(item.name) === normalizePersianName(req.name)
    );
    if (!found || found.quantity < scaledQty) {
      missingList.push(req.name);
    }
  });

  const substitutions = suggestSubstitutes(missingList);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <RetroWindow
            title={`دستور پخت: ${recipe.title}`}
            subtitle="دفترچه راهنمای آشپزی"
            onClose={onClose}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 480 }}
            >
              {/* Header Card */}
              <View style={styles.headerCard}>
                <View style={styles.iconBox}>
                  <FoodIconRenderer iconName={recipe.iconName} size={48} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.title}>{recipe.title}</Text>
                  <Text style={styles.desc}>{recipe.description}</Text>
                  <View style={styles.badgesRow}>
                    <RetroBadge
                      label={`زمان: ${recipe.prepTime}`}
                      color={COLORS.cream}
                      icon={<RetroClockIcon size={12} />}
                    />
                    <RetroBadge
                      label={`سطح: ${recipe.difficulty}`}
                      color={COLORS.yellow}
                      icon={<RetroSpeedometerIcon size={12} color={COLORS.black} />}
                    />
                  </View>
                </View>
              </View>

              {/* Servings Selector */}
              <View style={styles.servingsRow}>
                <Text style={styles.servingsLabel}>محاسبه مواد برای تعداد نفرات:</Text>
                <View style={styles.servingsControls}>
                  <Pressable
                    style={styles.servingsBtn}
                    onPress={() => setServings((s) => Math.max(1, s - 1))}
                  >
                    <RetroRemoveIcon size={14} color={COLORS.black} />
                  </Pressable>
                  <Text style={styles.servingsCount}>{toPersianDigits(servings)} نفر</Text>
                  <Pressable
                    style={styles.servingsBtn}
                    onPress={() => setServings((s) => Math.min(12, s + 1))}
                  >
                    <RetroAddIcon size={14} color={COLORS.black} />
                  </Pressable>
                </View>
              </View>

              {/* Ingredients Checklist */}
              <Text style={styles.sectionHeading}>مواد لازم برای {toPersianDigits(servings)} نفر:</Text>
              <View style={styles.ingredientsBox}>
                {recipe.ingredients.map((req, idx) => {
                  const scaledRequired = Math.max(1, Math.ceil(req.requiredQuantity * (servings / 2)));
                  const found = inventory.find(
                    (item) => normalizePersianName(item.name) === normalizePersianName(req.name)
                  );
                  const isAvailable = found && found.quantity >= scaledRequired;

                  return (
                    <View key={idx} style={styles.ingredientRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isAvailable ? COLORS.green : '#FF9E9E' },
                        ]}
                      >
                        <View style={styles.statusBadgeContent}>
                          {isAvailable ? (
                            <Ionicons name="checkmark" size={11} color="#0D5C2C" />
                          ) : (
                            <Ionicons name="close" size={11} color="#9C0006" />
                          )}
                          <Text style={styles.statusBadgeText}>
                            {isAvailable ? 'موجود است' : 'کسری در یخچال'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ingredientName}>
                        • {req.name} — {formatQuantity(scaledRequired, req.unit)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Substitutions Suggestion Section */}
              {substitutions.length > 0 && (
                <View style={styles.substitutesBox}>
                  <View style={styles.substitutesHeadingRow}>
                    <RetroBulbIcon size={15} color={COLORS.orange} />
                    <Text style={styles.substitutesHeading}>جایگزین‌های پیشنهادی برای کسری‌ها:</Text>
                  </View>
                  {substitutions.map((sub, idx) => (
                    <View key={idx} style={styles.substituteItem}>
                      <Text style={styles.substituteMissing}>بجای «{sub.missing}»:</Text>
                      <Text style={styles.substituteOptions}>
                        {sub.substitutes.join(' یا ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Cooking Instructions */}
              <Text style={styles.sectionHeading}>مراحل گام‌به‌گام پخت:</Text>
              <View style={styles.stepsBox}>
                {recipe.instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <Text style={styles.stepText}>{step}</Text>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>
                        {toPersianDigits(idx + 1)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Tips Section */}
              {recipe.tips && recipe.tips.length > 0 && (
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsHeading}>نکته طلایی سرآشپز 💡</Text>
                  {recipe.tips.map((tip, idx) => (
                    <Text key={idx} style={styles.tipText}>
                      - {tip}
                    </Text>
                  ))}
                </View>
              )}

              {/* Close Button */}
              <View style={styles.footerRow}>
                <RetroButton
                  label="بستن پنجره"
                  variant="primary"
                  onPress={onClose}
                  size="md"
                  style={{ width: '100%' }}
                />
              </View>
            </ScrollView>
          </RetroWindow>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  headerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 2,
    textAlign: 'right',
  },
  desc: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
    textAlign: 'right',
  },
  ingredientsBox: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE3DA',
  },
  ingredientName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  statusBadgeContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.black,
  },
  stepsBox: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.orange,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 18,
    textAlign: 'right',
  },
  tipsBox: {
    backgroundColor: '#FFF2C6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    marginBottom: 12,
  },
  tipsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 11,
    color: COLORS.black,
    lineHeight: 16,
    textAlign: 'right',
  },
  footerRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  servingsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    marginBottom: 10,
  },
  servingsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  servingsControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  servingsBtn: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.yellow,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    lineHeight: 18,
  },
  servingsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
    minWidth: 48,
    textAlign: 'center',
  },
  substitutesBox: {
    backgroundColor: '#EBF4DD',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  substitutesHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E5016',
    textAlign: 'right',
  },
  substitutesHeadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  substituteItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  substituteMissing: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A221E',
  },
  substituteOptions: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.black,
  },
});
