import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { FridgeLogoIcon, RetroMinimizeIcon, RetroMaximizeIcon, RetroCloseIcon } from '../icons/RetroIcons';

export const HeaderBar: React.FC = () => {
  return (
    <View style={styles.headerContainer}>
      {/* Top Application Bar */}
      <View style={styles.titleBar}>
        {/* Right side in Persian RTL: Logo + App Name */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <FridgeLogoIcon size={22} color={COLORS.orange} />
          </View>
          <View>
            <Text style={styles.appName}>یخچال من</Text>
            <Text style={styles.appVersion}>نسخه ۱.۰ (رترو سیستم)</Text>
          </View>
        </View>

        {/* Left side in Persian RTL: Retro Desktop Control Buttons */}
        <View style={styles.controlsRow}>
          <View style={styles.controlBox}>
            <RetroMinimizeIcon size={10} />
          </View>
          <View style={styles.controlBox}>
            <RetroMaximizeIcon size={10} />
          </View>
          <View style={[styles.controlBox, styles.closeBox]}>
            <RetroCloseIcon size={10} />
          </View>
        </View>
      </View>

      {/* Sub-header Ribbon with Persian Tagline */}
      <View style={styles.taglineRibbon}>
        <Text style={styles.taglineText}>با چیزهایی که داری، خوشمزه بپز! ✨</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusMd,
    overflow: 'hidden',
    marginBottom: 14,
    ...RETRO_SHADOW.md,
  },
  titleBar: {
    backgroundColor: COLORS.orange,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: BORDER.thick,
    borderBottomColor: COLORS.black,
  },
  brandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 6,
    padding: 3,
  },
  appName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
  },
  appVersion: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlBox: {
    width: 20,
    height: 18,
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBox: {
    backgroundColor: '#FF9E9E',
  },
  taglineRibbon: {
    backgroundColor: COLORS.bgLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
});
