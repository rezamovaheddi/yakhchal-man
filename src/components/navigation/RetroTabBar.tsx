import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TabType } from '../../types';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { RetroHomeIcon, RetroCookingIcon, RetroBookIcon } from '../icons/RetroIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RetroTabBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  bottomInset?: number;
}

export const RetroTabBar: React.FC<RetroTabBarProps> = ({
  currentTab,
  onSelectTab,
  bottomInset = 0,
}) => {
  const tabs: { key: TabType; label: string; icon: (isActive: boolean) => React.ReactNode }[] = [
    {
      key: 'home',
      label: 'خانه',
      icon: (isActive) => <RetroHomeIcon size={18} color={COLORS.black} active={isActive} />,
    },
    {
      key: 'cooking',
      label: 'آشپزی',
      icon: (isActive) => <RetroCookingIcon size={18} color={COLORS.black} active={isActive} />,
    },
    {
      key: 'ai-chef',
      label: 'سرآشپز AI',
      icon: (isActive) => (
        <MaterialCommunityIcons
          name={isActive ? 'robot' : 'robot-outline'}
          size={19}
          color={COLORS.black}
        />
      ),
    },
    {
      key: 'recipes',
      label: 'دستور پخت',
      icon: (isActive) => <RetroBookIcon size={18} color={COLORS.black} active={isActive} />,
    },
  ];

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <View style={styles.toolbarContainer}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              style={({ pressed }) => [
                styles.tabButton,
                isActive ? styles.tabButtonActive : styles.tabButtonInactive,
                pressed && styles.tabButtonPressed,
              ]}
            >
              <View style={styles.iconWrapper}>{tab.icon(isActive)}</View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.bg,
    borderTopWidth: BORDER.thick,
    borderTopColor: COLORS.black,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  toolbarContainer: {
    flexDirection: 'row-reverse', // Persian RTL order
    justifyContent: 'space-between',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    ...RETRO_SHADOW.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.orange,
  },
  tabButtonInactive: {
    backgroundColor: COLORS.cream,
  },
  tabButtonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: {
    marginLeft: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: COLORS.black,
  },
  tabLabelInactive: {
    color: COLORS.grayDark,
  },
});
