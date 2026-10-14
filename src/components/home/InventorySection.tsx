import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ingredient } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { formatQuantity, toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface InventorySectionProps {
  ingredients: Ingredient[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onOpenAddModal: () => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  ingredients,
  onIncrement,
  onDecrement,
  onOpenAddModal,
}) => {
  return (
    <RetroWindow
      title="موجودی یخچال من"
      subtitle={`${toPersianDigits(ingredients.length)} قلم کالا ثبت شده`}
    >
      {/* Grid of Item Cards */}
      <View style={styles.grid}>
        {ingredients.map((item) => {
          const isDepleted = item.quantity <= 0;
          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                isDepleted && styles.itemCardDepleted,
              ]}
            >
              {/* Card Header with Icon */}
              <View style={styles.iconCircle}>
                <FoodIconRenderer iconName={item.iconName} size={32} />
              </View>

              {/* Title & Category */}
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemCategory}>{item.category}</Text>

              {/* Quantity indicator */}
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>
                  {formatQuantity(item.quantity, item.unit)}
                </Text>
              </View>

              {/* Plus and Minus Controls */}
              <View style={styles.controlsRow}>
                <Pressable
                  onPress={() => onIncrement(item.id)}
                  style={({ pressed }) => [
                    styles.counterBtn,
                    styles.plusBtn,
                    pressed && styles.counterBtnPressed,
                  ]}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>

                <View style={styles.quantityNumberBox}>
                  <Text style={styles.quantityNumberText}>
                    {toPersianDigits(item.quantity)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onDecrement(item.id)}
                  disabled={isDepleted}
                  style={({ pressed }) => [
                    styles.counterBtn,
                    styles.minusBtn,
                    isDepleted && styles.counterBtnDisabled,
                    pressed && !isDepleted && styles.counterBtnPressed,
                  ]}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Food Button */}
      <View style={styles.footerRow}>
        <RetroButton
          label="+ افزودن مواد غذایی"
          variant="yellow"
          onPress={onOpenAddModal}
          size="md"
          style={styles.addBtn}
        />
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCard: {
    width: '48%', // 2 cards per row
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    alignItems: 'center',
    ...RETRO_SHADOW.sm,
  },
  itemCardDepleted: {
    opacity: 0.6,
    backgroundColor: '#EBE3DA',
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
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  quantityBadge: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...RETRO_SHADOW.sm,
  },
  plusBtn: {
    backgroundColor: COLORS.green,
  },
  minusBtn: {
    backgroundColor: '#FF9E9E',
  },
  counterBtnPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  counterBtnDisabled: {
    opacity: 0.4,
    backgroundColor: COLORS.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  counterBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.black,
    lineHeight: 18,
  },
  quantityNumberBox: {
    minWidth: 20,
    alignItems: 'center',
  },
  quantityNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
  },
  footerRow: {
    marginTop: 4,
  },
  addBtn: {
    width: '100%',
  },
});
