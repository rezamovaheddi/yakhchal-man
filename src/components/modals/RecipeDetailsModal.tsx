import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ingredient, Recipe } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { RetroClockIcon } from '../icons/RetroIcons';
import { formatQuantity, toPersianDigits } from '../../utils/persian';
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
  if (!recipe) return null;

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
                    />
                  </View>
                </View>
              </View>

              {/* Ingredients Checklist */}
              <Text style={styles.sectionHeading}>مواد لازم برای پخت:</Text>
              <View style={styles.ingredientsBox}>
                {recipe.ingredients.map((req, idx) => {
                  const normalizedReq = req.name.trim().toLowerCase();
                  const found = inventory.find(
                    (item) =>
                      item.name.trim().toLowerCase().includes(normalizedReq) ||
                      normalizedReq.includes(item.name.trim().toLowerCase())
                  );
                  const isAvailable = found && found.quantity >= req.requiredQuantity;

                  return (
                    <View key={idx} style={styles.ingredientRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isAvailable ? COLORS.green : '#FF9E9E' },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {isAvailable ? 'موجود است ✓' : 'کسری در یخچال ✗'}
                        </Text>
                      </View>
                      <Text style={styles.ingredientName}>
                        • {req.name} — {formatQuantity(req.requiredQuantity, req.unit)}
                      </Text>
                    </View>
                  );
                })}
              </View>

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
});
