import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { RetroCloseIcon, RetroMinimizeIcon, RetroMaximizeIcon } from '../icons/RetroIcons';

interface RetroWindowProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerColor?: string;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
  onClose?: () => void;
  showControls?: boolean;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({
  title,
  subtitle,
  children,
  headerColor = COLORS.orange,
  style,
  bodyStyle,
  onClose,
  showControls = true,
}) => {
  return (
    <View style={[styles.windowContainer, style]}>
      {/* Title Bar */}
      <View style={[styles.titleBar, { backgroundColor: headerColor }]}>
        {/* Right side in Persian RTL: Window Title */}
        <View style={styles.titleInfo}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        {/* Left side in Persian RTL: Retro Desktop Window Controls */}
        {showControls && (
          <View style={styles.controlsRow}>
            <View style={styles.controlBtn}>
              <RetroMinimizeIcon size={10} color={COLORS.black} />
            </View>
            <View style={styles.controlBtn}>
              <RetroMaximizeIcon size={10} color={COLORS.black} />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.controlBtn, onClose ? styles.closeBtnActive : null]}
            >
              <RetroCloseIcon size={10} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Window Body */}
      <View style={[styles.windowBody, bodyStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  windowContainer: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusMd,
    overflow: 'hidden',
    marginBottom: 16,
    ...RETRO_SHADOW.md,
  },
  titleBar: {
    flexDirection: 'row-reverse', // Persian RTL: title on right, controls on left
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.black,
  },
  titleInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'right',
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlBtn: {
    width: 20,
    height: 18,
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnActive: {
    backgroundColor: '#FFA59E',
  },
  windowBody: {
    padding: 12,
    backgroundColor: COLORS.cream,
  },
});
