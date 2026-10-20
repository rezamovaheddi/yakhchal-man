import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ingredient } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { formatQuantity, toPersianDigits } from '../../utils/persian';
import { getExpiryBadgeText } from '../../utils/antiWasteEngine';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import {
  RetroAddIcon,
  RetroRemoveIcon,
  RetroCheckCircleIcon,
  RetroTrashIcon,
  RetroSnowflakeIcon,
  RetroCupboardIcon,
  RetroEditIcon,
} from '../icons/RetroIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InventorySectionProps {
  ingredients: Ingredient[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onOpenAddModal: () => void;
  onEditSelection?: () => void;
  fridgeName?: string;
  onConsumeItem?: (id: string) => void;
  onWasteItem?: (id: string) => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  ingredients,
  onIncrement,
  onDecrement,
  onOpenAddModal,
  onEditSelection,
  fridgeName,
  onConsumeItem,
  onWasteItem,
}) => {
  return (
    <RetroWindow
      title={fridgeName ? `موجودی ${fridgeName}` : 'موجودی یخچال من'}
      subtitle={`${toPersianDigits(ingredients.length)} قلم کالا ثبت شده`}
    >
      {/* Grid of Item Cards */}
      {ingredients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>هنوز هیچ ماده‌ای در این یخچال ثبت نشده است!</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {ingredients.map((item) => {
            const isDepleted = item.quantity <= 0;
            const expiryInfo = getExpiryBadgeText(item.expiryDate);
            const isExpired = expiryInfo.status === 'expired';
            const isExpiringSoon = expiryInfo.status === 'expiring_soon';

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  isDepleted && styles.itemCardDepleted,
                  isExpiringSoon && !isDepleted && styles.itemCardExpiring,
                  isExpired && !isDepleted && styles.itemCardExpired,
                ]}
              >
                {/* Expiry Badge at Top of Card */}
                {item.expiryDate && (
                  <View
                    style={[
                      styles.expiryTag,
                      isExpired
                        ? styles.expiryTagExpired
                        : isExpiringSoon
                        ? styles.expiryTagExpiring
                        : styles.expiryTagFresh,
                    ]}
                  >
                    <View style={styles.expiryTagRow}>
                      {isExpired ? (
                        <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#D9381E" />
                      ) : isExpiringSoon ? (
                        <MaterialCommunityIcons name="clock-alert-outline" size={13} color="#B35300" />
                      ) : (
                        <MaterialCommunityIcons name="leaf" size={13} color={COLORS.green} />
                      )}
                      <Text
                        style={[
                          styles.expiryTagText,
                          isExpired && styles.expiryTagTextExpired,
                        ]}
                        numberOfLines={1}
                      >
                        {expiryInfo.text}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Card Header with Icon */}
                <View style={styles.iconCircle}>
                  <FoodIconRenderer iconName={item.iconName} size={32} />
                </View>

                {/* Title & Category */}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>

                {/* Location & Category Tag */}
                <View style={styles.metaRow}>
                  <View style={styles.locationTagRow}>
                    {item.storageLocation === 'فریزر' ? (
                      <RetroSnowflakeIcon size={12} color="#0288D1" />
                    ) : item.storageLocation === 'کابینت' ? (
                      <RetroCupboardIcon size={12} color="#6D4C41" />
                    ) : (
                      <MaterialCommunityIcons name="fridge-outline" size={12} color={COLORS.black} />
                    )}
                    <Text style={styles.locationTagText}>
                      {item.storageLocation ?? 'یخچال'}
                    </Text>
                  </View>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>

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
                    <RetroAddIcon size={15} color={COLORS.black} />
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
                    <RetroRemoveIcon size={15} color={isDepleted ? COLORS.grayDark : COLORS.black} />
                  </Pressable>
                </View>

                {/* Quick Consume / Waste Shortcut if expiring */}
                {(isExpiringSoon || isExpired) && !isDepleted && (
                  <View style={styles.cardQuickActions}>
                    {onConsumeItem && (
                      <Pressable
                        onPress={() => onConsumeItem(item.id)}
                        style={({ pressed }) => [
                          styles.miniActionBtn,
                          styles.miniConsumeBtn,
                          pressed && styles.counterBtnPressed,
                        ]}
                      >
                        <View style={styles.miniBtnRow}>
                          <RetroCheckCircleIcon size={13} color={COLORS.black} />
                          <Text style={styles.miniActionBtnText}>مصرف</Text>
                        </View>
                      </Pressable>
                    )}
                    {onWasteItem && (
                      <Pressable
                        onPress={() => onWasteItem(item.id)}
                        style={({ pressed }) => [
                          styles.miniActionBtn,
                          styles.miniWasteBtn,
                          pressed && styles.counterBtnPressed,
                        ]}
                      >
                        <View style={styles.miniBtnRow}>
                          <RetroTrashIcon size={13} color="#D9381E" />
                          <Text style={[styles.miniActionBtnText, styles.miniWasteBtnText]}>
                            دورریز
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.footerRow}>
        <RetroButton
          label="افزودن مواد غذایی"
          icon={<RetroAddIcon size={16} color={COLORS.black} />}
          variant="yellow"
          onPress={onOpenAddModal}
          size="md"
          style={{ flex: 1.2 }}
        />
        {onEditSelection && (
          <RetroButton
            label="ویرایش اقلام"
            icon={<RetroEditIcon size={15} color={COLORS.black} />}
            variant="secondary"
            onPress={onEditSelection}
            size="md"
            style={{ flex: 1 }}
          />
        )}
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
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: COLORS.creamInput,
    borderRadius: BORDER.radiusSm,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  itemCardExpiring: {
    borderColor: COLORS.orange,
    backgroundColor: '#FFFBF0',
  },
  itemCardExpired: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF0F0',
  },
  expiryTag: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    zIndex: 2,
    ...RETRO_SHADOW.sm,
  },
  expiryTagFresh: {
    backgroundColor: '#E8F5E9',
  },
  expiryTagExpiring: {
    backgroundColor: COLORS.yellow,
  },
  expiryTagExpired: {
    backgroundColor: '#FFCDD2',
  },
  expiryTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.black,
  },
  expiryTagTextExpired: {
    color: '#B71C1C',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
    backgroundColor: COLORS.cream,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  cardQuickActions: {
    flexDirection: 'row-reverse',
    gap: 4,
    marginTop: 8,
    width: '100%',
  },
  expiryTagRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  locationTagRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.cream,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  locationTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
  },
  miniBtnRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  miniActionBtn: {
    flex: 1,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...RETRO_SHADOW.sm,
  },
  miniConsumeBtn: {
    backgroundColor: '#C8E6C9',
  },
  miniWasteBtn: {
    backgroundColor: '#FFCCBC',
  },
  miniActionBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
  },
  miniWasteBtnText: {
    color: '#B71C1C',
  },
});
