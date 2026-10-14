import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TabType } from '../../types';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { RetroHomeIcon, RetroCookingIcon, RetroBookIcon } from '../icons/RetroIcons';

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
      icon: (isActive) => <RetroHomeIcon size={20} color={COLORS.black} />,
    },
    {
      key: 'cooking',
      label: 'آشپزی',
      icon: (isActive) => <RetroCookingIcon size={20} color={COLORS.black} />,
    },
    {
      key: 'recipes',
      label: 'دستور پخت',
      icon: (isActive) => <RetroBookIcon size={20} color={COLORS.black} />,
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  toolbarContainer: {
    flexDirection: 'row-reverse', // Persian RTL order: خانه (right), آشپزی (center), دستور پخت (left)
    justifyContent: 'space-between',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    marginLeft: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: COLORS.black,
  },
  tabLabelInactive: {
    color: COLORS.grayDark,
  },
});
