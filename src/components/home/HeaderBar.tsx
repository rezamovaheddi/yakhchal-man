import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import {
  FridgeLogoIcon,
  RetroMinimizeIcon,
  RetroMaximizeIcon,
  RetroCloseIcon,
  RetroSparkleIcon,
  RetroUserIcon,
} from '../icons/RetroIcons';
import { AvatarRenderer } from '../icons/AvatarIcons';
import { UserAccount } from '../../types';

interface HeaderBarProps {
  currentUser?: UserAccount | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onCheckUpdates?: () => void;
  hasUpdate?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onCheckUpdates,
  hasUpdate,
}) => {
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
            <Pressable onPress={onCheckUpdates}>
              <View style={styles.versionRow}>
                <Text style={styles.appVersion}>نسخه ۱.۲</Text>
                {hasUpdate ? (
                  <View style={styles.updateAvailableRow}>
                    <RetroSparkleIcon size={11} color={COLORS.yellow} />
                    <Text style={styles.updateAvailableText}>به‌روزرسانی جدید!</Text>
                  </View>
                ) : (
                  <Text style={styles.appVersion}>(رترو سیستم)</Text>
                )}
              </View>
            </Pressable>
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

      {/* Sub-header Ribbon with Persian Tagline & Account Pill */}
      <View style={styles.subBar}>
        <View style={styles.taglineRow}>
          <RetroSparkleIcon size={14} color={COLORS.orange} />
          <Text style={styles.taglineText} numberOfLines={1}>
            با چیزهایی که داری، خوشمزه بپز!
          </Text>
        </View>

        <Pressable
          onPress={currentUser ? onOpenProfile : onOpenAuth}
          style={({ pressed }) => [
            styles.userBadge,
            currentUser ? styles.userBadgeLoggedIn : styles.userBadgeGuest,
            pressed && styles.userBadgePressed,
          ]}
        >
          {currentUser ? (
            <View style={styles.userBadgeContent}>
              <AvatarRenderer avatarId={currentUser.avatar} size={18} />
              <Text style={styles.userNameText} numberOfLines={1}>
                {currentUser.name}
              </Text>
            </View>
          ) : (
            <View style={styles.userBadgeContent}>
              <RetroUserIcon size={16} color={COLORS.black} />
              <Text style={styles.loginText}>ورود / ثبت‌نام</Text>
            </View>
          )}
        </Pressable>
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
  subBar: {
    backgroundColor: COLORS.bgLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taglineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
  },
  versionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  updateAvailableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  updateAvailableText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.orange,
  },
  userBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    ...RETRO_SHADOW.sm,
  },
  userBadgeLoggedIn: {
    backgroundColor: COLORS.yellow,
  },
  userBadgeGuest: {
    backgroundColor: COLORS.lavender,
  },
  userBadgePressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    elevation: 0,
    shadowOpacity: 0,
  },
  userBadgeContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.black,
    maxWidth: 90,
  },
  loginText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
  },
});
