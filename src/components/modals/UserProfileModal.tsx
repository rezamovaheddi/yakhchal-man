import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { AvatarRenderer } from '../icons/AvatarIcons';
import { UserAccount } from '../../types';
import { toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface UserProfileModalProps {
  visible: boolean;
  user: UserAccount | null;
  fridgeName: string;
  itemsCount: number;
  onClose: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onCheckUpdates?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  user,
  fridgeName,
  itemsCount,
  onClose,
  onLogout,
  onSwitchAccount,
  onCheckUpdates,
}) => {
  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <RetroWindow
            title="پروفایل کاربر"
            subtitle="شناسنامه سیستم هوشمند"
            onClose={onClose}
            headerColor={COLORS.lavender}
          >
            <View style={styles.content}>
              {/* Profile Card Header */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <AvatarRenderer avatarId={user.avatar} size={54} />
                </View>

                <View style={styles.namesCol}>
                  <Text style={styles.displayName}>{user.name}</Text>
                  <Text style={styles.usernameText}>@{user.username}</Text>
                  <View style={styles.badgeRow}>
                    <RetroBadge
                      label="سرآشپز فعال ✨"
                      color={COLORS.yellow}
                    />
                  </View>
                </View>
              </View>

              {/* Stats Box */}
              <View style={styles.statsCard}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>یخچال فعال:</Text>
                  <Text style={styles.statValue}>{fridgeName}</Text>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>تعداد اقلام ثبت‌شده:</Text>
                  <Text style={styles.statValue}>
                    {toPersianDigits(itemsCount)} قلم کالا
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>تاریخ عضویت:</Text>
                  <Text style={styles.statValue}>{toPersianDigits(user.createdAt)}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                {onCheckUpdates && (
                  <RetroButton
                    label="بررسی به‌روزرسانی برنامه 🔄"
                    variant="primary"
                    onPress={onCheckUpdates}
                    size="md"
                  />
                )}

                <RetroButton
                  label="تعویض حساب کاربری 👤"
                  variant="secondary"
                  onPress={onSwitchAccount}
                  size="md"
                />

                <RetroButton
                  label="خروج از حساب 🚪"
                  variant="danger"
                  onPress={onLogout}
                  size="md"
                />

                <RetroButton
                  label="بستن پنجره"
                  variant="primary"
                  onPress={onClose}
                  size="sm"
                />
              </View>
            </View>
          </RetroWindow>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 18, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
  },
  content: {
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    ...RETRO_SHADOW.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgLight,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  namesCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
  },
  usernameText: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
  },
  statsCard: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    gap: 6,
  },
  statRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.grayDark,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.black,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
});
