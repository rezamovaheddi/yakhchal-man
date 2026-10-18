import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WasteTrackingStats } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface WasteSavingsCardProps {
  stats?: WasteTrackingStats;
}

export const WasteSavingsCard: React.FC<WasteSavingsCardProps> = ({ stats }) => {
  const currentStats = stats ?? {
    monthlySavedTomans: 0,
    monthlyWastedTomans: 0,
    consumedItemsCount: 0,
    wastedItemsCount: 0,
  };

  const formatTomans = (amount: number) => {
    return toPersianDigits(amount.toLocaleString('en-US')) + ' تومان';
  };

  // Calculate efficiency / rescue rate percentage
  const totalItems = currentStats.consumedItemsCount + currentStats.wastedItemsCount;
  const rescueRate = totalItems > 0
    ? Math.round((currentStats.consumedItemsCount / totalItems) * 100)
    : 100;

  return (
    <RetroWindow
      title="💰 صرفه‌جویی و کنترل دورریز"
      subtitle="محاسبه ارزش مواد مصرف‌شده و دورریز ماهانه"
    >
      <View style={styles.container}>
        <View style={styles.statsRow}>
          {/* Saved Money Box */}
          <View style={[styles.statBox, styles.savedBox]}>
            <Text style={styles.statLabel}>صرفه‌جویی ماهانه 💵</Text>
            <Text style={[styles.statValue, styles.savedValue]}>
              {formatTomans(currentStats.monthlySavedTomans)}
            </Text>
            <Text style={styles.statSub}>
              {toPersianDigits(currentStats.consumedItemsCount)} قلم به‌موقع مصرف شد
            </Text>
          </View>

          {/* Wasted Money Box */}
          <View style={[styles.statBox, styles.wastedBox]}>
            <Text style={styles.statLabel}>میزان دورریز 🗑️</Text>
            <Text style={[styles.statValue, styles.wastedValue]}>
              {formatTomans(currentStats.monthlyWastedTomans)}
            </Text>
            <Text style={styles.statSub}>
              {toPersianDigits(currentStats.wastedItemsCount)} قلم منقضی شد
            </Text>
          </View>
        </View>

        {/* Efficiency Rate Pill */}
        <View style={styles.efficiencyCard}>
          <View style={styles.efficiencyHeader}>
            <Text style={styles.efficiencyTitle}>شاخص سلامت مصرف یخچال:</Text>
            <Text style={styles.efficiencyPercent}>{toPersianDigits(rescueRate)}٪</Text>
          </View>
          <Text style={styles.efficiencyDesc}>
            {rescueRate >= 80
              ? '🌟 عملکرد عالی! با مصرف به‌موقع هزینه‌های خانه را به حداقل رسانده‌اید.'
              : '💡 با انتخاب دستورهای ضد دورریز، اقلام در معرض خطر را نجات دهید!'}
          </Text>
        </View>
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    alignItems: 'center',
    ...RETRO_SHADOW.sm,
  },
  savedBox: {
    backgroundColor: '#E8F5E9',
  },
  wastedBox: {
    backgroundColor: '#FFEBEE',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  savedValue: {
    color: '#2E7D32',
  },
  wastedValue: {
    color: '#C62828',
  },
  statSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  efficiencyCard: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 8,
    ...RETRO_SHADOW.sm,
  },
  efficiencyHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  efficiencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  efficiencyPercent: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.orange,
  },
  efficiencyDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.grayDark,
    textAlign: 'right',
    lineHeight: 16,
  },
});
