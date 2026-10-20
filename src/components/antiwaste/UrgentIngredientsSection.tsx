import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ingredient, StorageLocation } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroBadge } from '../common/RetroBadge';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { getUrgentIngredients, getExpiryBadgeText } from '../../utils/antiWasteEngine';
import { formatQuantity, toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import {
  RetroSparkleIcon,
  RetroCheckCircleIcon,
  RetroTrashIcon,
  RetroSnowflakeIcon,
  RetroCupboardIcon,
} from '../icons/RetroIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UrgentIngredientsSectionProps {
  inventory: Ingredient[];
  onConsumeItem: (id: string) => void;
  onWasteItem: (id: string) => void;
  onCookWithUrgent: () => void;
}

export const UrgentIngredientsSection: React.FC<UrgentIngredientsSectionProps> = ({
  inventory,
  onConsumeItem,
  onWasteItem,
  onCookWithUrgent,
}) => {
  const urgentList = getUrgentIngredients(inventory);

  if (urgentList.length === 0) {
    return (
      <View style={styles.allFreshBanner}>
        <View style={styles.allFreshIconBox}>
          <RetroSparkleIcon size={24} color={COLORS.yellow} />
        </View>
        <View style={styles.allFreshTextContainer}>
          <Text style={styles.allFreshTitle}>همه مواد غذایی تازه هستند!</Text>
          <Text style={styles.allFreshDesc}>هیچ ماده‌ای در معرض انقضا یا دورریز نیست. عالی مدیریت کردی!</Text>
        </View>
      </View>
    );
  }

  return (
    <RetroWindow
      title="اول این مواد را مصرف کن!"
      subtitle={`${toPersianDigits(urgentList.length)} قلم نیاز به مصرف فوری یا انقضا دارند`}
      headerColor="#FF7043"
    >
      <View style={styles.container}>
        <Text style={styles.noticeText}>
          مواد زیر نزدیک به تاریخ انقضا هستند؛ با اولویت قرار دادن آن‌ها در پخت غذا، مانع دورریز شوید:
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {urgentList.map(({ item, daysLeft, status }) => {
            const badge = getExpiryBadgeText(item.expiryDate);
            const isExpired = status === 'expired';

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isExpired ? styles.cardExpired : styles.cardExpiring,
                ]}
              >
                {/* Status Indicator Bar */}
                <View
                  style={[
                    styles.statusPill,
                    isExpired ? styles.statusPillExpired : styles.statusPillExpiring,
                  ]}
                >
                  <View style={styles.statusPillContent}>
                    {isExpired ? (
                      <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons name="clock-alert-outline" size={12} color="#B35300" />
                    )}
                    <Text style={styles.statusPillText}>
                      {isExpired ? 'منقضی شده' : badge.text}
                    </Text>
                  </View>
                </View>

                {/* Food Icon */}
                <View style={styles.iconCircle}>
                  <FoodIconRenderer iconName={item.iconName} size={30} />
                </View>

                {/* Item Name & Details */}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQuantity}>
                  {formatQuantity(item.quantity, item.unit)}
                </Text>
                <View style={styles.locationTagRow}>
                  {item.storageLocation === 'فریزر' ? (
                    <RetroSnowflakeIcon size={11} color="#0288D1" />
                  ) : item.storageLocation === 'کابینت' ? (
                    <RetroCupboardIcon size={11} color="#6D4C41" />
                  ) : (
                    <MaterialCommunityIcons name="fridge-outline" size={11} color={COLORS.black} />
                  )}
                  <Text style={styles.locationTagText}>
                    {item.storageLocation ?? 'یخچال'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => onConsumeItem(item.id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.consumeBtn,
                      pressed && styles.actionBtnPressed,
                    ]}
                  >
                    <View style={styles.btnContentRow}>
                      <RetroCheckCircleIcon size={12} color={COLORS.black} />
                      <Text style={styles.actionBtnText}>مصرف شد</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => onWasteItem(item.id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.wasteBtn,
                      pressed && styles.actionBtnPressed,
                    ]}
                  >
                    <View style={styles.btnContentRow}>
                      <RetroTrashIcon size={12} color="#D9381E" />
                      <Text style={[styles.actionBtnText, styles.wasteBtnText]}>دورریز</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Cook Button Shortcut */}
        <Pressable
          onPress={onCookWithUrgent}
          style={({ pressed }) => [
            styles.cookPromptBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <View style={styles.cookPromptRow}>
            <MaterialCommunityIcons name="pot-steam" size={18} color={COLORS.black} />
            <Text style={styles.cookPromptText}>
              نمایش غذاهایی که این مواد را نجات می‌دهند!
            </Text>
          </View>
        </Pressable>
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 4,
  },
  scrollList: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingVertical: 4,
  },
  card: {
    width: 155,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    alignItems: 'center',
    ...RETRO_SHADOW.sm,
  },
  cardExpiring: {
    backgroundColor: '#FFF9E6',
    borderColor: COLORS.orange,
  },
  cardExpired: {
    backgroundColor: '#FFEAEA',
    borderColor: '#D32F2F',
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    marginBottom: 6,
    width: '100%',
    alignItems: 'center',
  },
  statusPillExpiring: {
    backgroundColor: COLORS.yellow,
  },
  statusPillExpired: {
    backgroundColor: '#FFCDD2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.black,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...RETRO_SHADOW.sm,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'center',
  },
  itemQuantity: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginTop: 2,
  },
  locationTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    backgroundColor: COLORS.cream,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.black,
    marginTop: 4,
    marginBottom: 8,
  },
  cardActions: {
    width: '100%',
    gap: 4,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...RETRO_SHADOW.sm,
  },
  actionBtnPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  consumeBtn: {
    backgroundColor: '#C8E6C9', // light green
  },
  wasteBtn: {
    backgroundColor: '#FFCCBC', // soft red/coral
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
  },
  wasteBtnText: {
    color: '#B71C1C',
  },
  cookPromptBtn: {
    backgroundColor: COLORS.orange,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 6,
    ...RETRO_SHADOW.sm,
  },
  cookPromptText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.black,
  },
  allFreshBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    ...RETRO_SHADOW.sm,
  },
  statusPillContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  locationTagRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.cream,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.black,
    marginTop: 2,
    marginBottom: 4,
  },
  locationTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.black,
  },
  btnContentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  cookPromptRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  allFreshIconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allFreshTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  allFreshTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1B5E20',
  },
  allFreshDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.grayDark,
    marginTop: 2,
  },
});
