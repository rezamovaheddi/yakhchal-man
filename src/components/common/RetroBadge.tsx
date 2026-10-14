import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER } from '../../constants/theme';

interface RetroBadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const RetroBadge: React.FC<RetroBadgeProps> = ({
  label,
  color = COLORS.yellow,
  textColor = COLORS.black,
  icon,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    gap: 4,
  },
  icon: {
    marginLeft: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
