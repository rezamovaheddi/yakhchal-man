import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ingredient, IngredientCategory } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { toPersianDigits, formatQuantity } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface ItemSelectionStepProps {
  fridgeName: string;
  catalogItems: Ingredient[];
  selectedItemIds: Set<string>;
  onToggleItem: (id: string) => void;
  onIncrementQuantity: (id: string) => void;
  onDecrementQuantity: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenAddModal: () => void;
  onConfirmSelection: () => void;
  onBackToFridgeName: () => void;
}

const CATEGORIES: ('همه' | IngredientCategory)[] = [
  'همه',
  'پروتئین',
  'سبزیجات',
  'لبنیات',
  'سایر',
];

export const ItemSelectionStep: React.FC<ItemSelectionStepProps> = ({
  fridgeName,
  catalogItems,
  selectedItemIds,
  onToggleItem,
  onIncrementQuantity,
  onDecrementQuantity,
  onSelectAll,
  onDeselectAll,
  onOpenAddModal,
  onConfirmSelection,
  onBackToFridgeName,
}) => {
  const [activeCategory, setActiveCategory] = useState<'همه' | IngredientCategory>('همه');

  const filteredItems = catalogItems.filter((item) => {
    if (activeCategory === 'همه') return true;
    return item.category === activeCategory;
  });

  const selectedCount = selectedItemIds.size;

  return (
    <RetroWindow
      title="گام ۲: انتخاب اقلام داخل یخچال"
      subtitle={`یخچال: ${fridgeName}`}
      headerColor={COLORS.yellow}
    >
      <View style={styles.container}>
        {/* Top Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>
              {toPersianDigits(selectedCount)} قلم انتخاب شده
            </Text>
          </View>

          <View style={styles.quickActions}>
            <Pressable onPress={onSelectAll} style={styles.smallActionBtn}>
              <Text style={styles.smallActionText}>انتخاب همه</Text>
            </Pressable>
            <Pressable onPress={onDeselectAll} style={styles.smallActionBtn}>
              <Text style={styles.smallActionText}>پاک کردن</Text>
            </Pressable>
          </View>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.instructionText}>
          موادی که در یخچالت داری رو با لمس انتخاب کن و در صورت نیاز تعدادش رو تغییر بده:
        </Text>

        {/* Grid of Items */}
        <View style={styles.grid}>
          {filteredItems.map((item) => {
            const isSelected = selectedItemIds.has(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => onToggleItem(item.id)}
                style={[
                  styles.itemCard,
                  isSelected ? styles.itemCardSelected : styles.itemCardUnselected,
                ]}
              >
                {/* Checkmark Tag */}
                <View
                  style={[
                    styles.selectionTag,
                    isSelected ? styles.tagSelected : styles.tagUnselected,
                  ]}
                >
                  <Text style={styles.selectionTagText}>
                    {isSelected ? '✓ در یخچال' : '+ افزودن'}
                  </Text>
                </View>

                {/* Icon */}
                <View
                  style={[
                    styles.iconCircle,
                    isSelected && styles.iconCircleSelected,
                  ]}
                >
                  <FoodIconRenderer iconName={item.iconName} size={30} />
                </View>

                {/* Name & Category */}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemCategory}>{item.category}</Text>

                {/* Quantity or Tap to add */}
                {isSelected ? (
                  <View style={styles.counterRow} onStartShouldSetResponder={() => true}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onIncrementQuantity(item.id);
                      }}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterBtnText}>+</Text>
                    </Pressable>

                    <Text style={styles.quantityText}>
                      {formatQuantity(item.quantity, item.unit)}
                    </Text>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onDecrementQuantity(item.id);
                      }}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterBtnText}>-</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.tapToAddBox}>
                    <Text style={styles.tapToAddText}>لمس برای انتخاب</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Add custom ingredient button */}
        <View style={styles.customAddRow}>
          <RetroButton
            label="+ افزودن ماده دلخواه جدید"
            variant="lavender"
            onPress={onOpenAddModal}
            size="sm"
            style={styles.addCustomBtn}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <RetroButton
            label="🍽️ دریافت غذای پیشنهادی بر اساس این اقلام ⬅️"
            variant="primary"
            onPress={onConfirmSelection}
            disabled={selectedCount === 0}
            size="lg"
            style={styles.confirmBtn}
          />

          <RetroButton
            label="⬅️ بازگشت به ویرایش نام یخچال"
            variant="secondary"
            onPress={onBackToFridgeName}
            size="sm"
            style={styles.backBtn}
          />
        </View>
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  infoBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeBox: {
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    ...RETRO_SHADOW.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  quickActions: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  smallActionBtn: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  smallActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.black,
  },
  categoryRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryChipActive: {
    backgroundColor: COLORS.orange,
    ...RETRO_SHADOW.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  categoryTextActive: {
    fontWeight: '900',
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
    marginBottom: 10,
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCard: {
    width: '48%',
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
    ...RETRO_SHADOW.sm,
  },
  itemCardSelected: {
    backgroundColor: COLORS.creamInput,
    borderColor: COLORS.black,
  },
  itemCardUnselected: {
    backgroundColor: '#ECE3D4',
    opacity: 0.75,
  },
  selectionTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  tagSelected: {
    backgroundColor: COLORS.green,
  },
  tagUnselected: {
    backgroundColor: COLORS.bgLight,
  },
  selectionTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.black,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  iconCircleSelected: {
    backgroundColor: '#FFEFA6',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  itemCategory: {
    fontSize: 9,
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  counterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    width: '100%',
  },
  counterBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: COLORS.yellow,
    borderWidth: 1,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.black,
    lineHeight: 16,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    flex: 1,
    textAlign: 'center',
  },
  tapToAddBox: {
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  tapToAddText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.grayDark,
  },
  customAddRow: {
    marginBottom: 12,
  },
  addCustomBtn: {
    width: '100%',
  },
  bottomActions: {
    gap: 8,
  },
  confirmBtn: {
    width: '100%',
  },
  backBtn: {
    width: '100%',
  },
});
