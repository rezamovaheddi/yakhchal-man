import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  View,
} from 'react-native';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'yellow' | 'lavender' | 'green' | 'danger';

interface RetroButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
  disabled = false,
  size = 'md',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getBackgroundColor = () => {
    if (disabled) return COLORS.grayLight;
    switch (variant) {
      case 'primary':
        return COLORS.orange;
      case 'secondary':
        return COLORS.cream;
      case 'yellow':
        return COLORS.yellow;
      case 'lavender':
        return COLORS.lavender;
      case 'green':
        return COLORS.green;
      case 'danger':
        return COLORS.red;
      default:
        return COLORS.orange;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 10 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      case 'md':
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 14;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={({ pressed }) => [
        styles.buttonBase,
        getPadding(),
        { backgroundColor: getBackgroundColor() },
        isPressed || pressed ? styles.buttonPressed : styles.buttonNormal,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.labelBase,
            { fontSize: getFontSize() },
            disabled && styles.labelDisabled,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonNormal: {
    ...RETRO_SHADOW.sm,
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  buttonPressed: {
    shadowOpacity: 0,
    elevation: 0,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconContainer: {
    marginLeft: 4,
  },
  labelBase: {
    color: COLORS.black,
    fontWeight: '800',
    textAlign: 'center',
  },
  labelDisabled: {
    color: COLORS.grayDark,
  },
});
