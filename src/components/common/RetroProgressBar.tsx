import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER } from '../../constants/theme';

interface RetroProgressBarProps {
  percentage: number; // 0 to 100
  totalBlocks?: number;
  blockColor?: string;
  style?: ViewStyle;
}

export const RetroProgressBar: React.FC<RetroProgressBarProps> = ({
  percentage,
  totalBlocks = 18,
  blockColor = COLORS.lavender,
  style,
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const activeBlocksCount = Math.round((clamped / 100) * totalBlocks);

  return (
    <View style={[styles.track, style]}>
      {Array.from({ length: totalBlocks }).map((_, index) => {
        const isActive = index < activeBlocksCount;
        return (
          <View
            key={index}
            style={[
              styles.block,
              {
                backgroundColor: isActive ? blockColor : 'transparent',
                borderColor: isActive ? '#6A568A' : 'transparent',
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 18,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: 4,
    padding: 2,
    alignItems: 'center',
    gap: 2,
    // Retro inset shadow
    borderTopColor: '#000',
    borderRightColor: '#000',
    borderLeftColor: '#7A6D65',
    borderBottomColor: '#8C7F75',
  },
  block: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
    borderWidth: 0.5,
  },
});
