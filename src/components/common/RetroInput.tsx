import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER } from '../../constants/theme';

interface RetroInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  keyboardType?: 'default' | 'numeric';
}

export const RetroInput: React.FC<RetroInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  icon,
  style,
  inputStyle,
  keyboardType = 'default',
}) => {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8C7F75"
          style={[styles.input, inputStyle]}
          textAlign="right"
          keyboardType={keyboardType}
        />
        {icon && <View style={styles.iconBox}>{icon}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingHorizontal: 8,
    // Retro inset look
    borderTopColor: '#000000',
    borderRightColor: '#000000',
    borderLeftColor: '#4A423D',
    borderBottomColor: '#6B6059',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  iconBox: {
    marginLeft: 6,
  },
});
