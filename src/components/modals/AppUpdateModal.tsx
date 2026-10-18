import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { RetroProgressBar } from '../common/RetroProgressBar';
import { AppReleaseInfo, UpdateCheckState } from '../../types';
import { CURRENT_APP_VERSION } from '../../utils/updateService';
import { toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface AppUpdateModalProps {
  visible: boolean;
  state: UpdateCheckState;
  releaseInfo: AppReleaseInfo | null;
  errorMessage?: string;
  onClose: () => void;
  onRetryCheck?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  state,
  releaseInfo,
  errorMessage,
  onClose,
  onRetryCheck,
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const handleStartUpdate = async () => {
    if (!releaseInfo) return;
    const targetUrl = releaseInfo.downloadUrl || releaseInfo.webUrl;
    try {
      // Simulate retro progress feedback before opening download/browser link
      setDownloadProgress(25);
      setTimeout(() => setDownloadProgress(70), 300);
      setTimeout(async () => {
        setDownloadProgress(100);
        await Linking.openURL(targetUrl);
        setTimeout(() => setDownloadProgress(null), 1000);
      }, 700);
    } catch (e) {
      console.warn('Could not open update URL:', e);
      setDownloadProgress(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <RetroWindow
            title="مرکز به‌روزرسانی سیستم"
            subtitle="نرم‌افزار یخچال من"
            onClose={onClose}
            headerColor={COLORS.orange}
          >
            <View style={styles.content}>
              {/* Checking State */}
              {state === 'checking' && (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={COLORS.orange} />
                  <Text style={styles.statusTitle}>در حال جستجوی نسخه جدید...</Text>
                  <Text style={styles.statusSub}>
                    نسخه فعلی: {toPersianDigits(CURRENT_APP_VERSION)}
                  </Text>
                  <RetroProgressBar percentage={60} style={{ width: '100%', marginTop: 12 }} />
                </View>
              )}

              {/* Up to date State */}
              {state === 'up_to_date' && (
                <View style={styles.centerBox}>
                  <View style={styles.badgeLarge}>
                    <Text style={styles.badgeLargeText}>✅</Text>
                  </View>
                  <Text style={styles.statusTitle}>برنامه شما به‌روز است!</Text>
                  <Text style={styles.statusSub}>
                    شما در حال استفاده از آخرین نگارش برنامه هستید: نسخه {toPersianDigits(CURRENT_APP_VERSION)}
                  </Text>
                  <RetroButton
                    label="بسیار عالی!"
                    variant="primary"
                    onPress={onClose}
                    size="md"
                    style={{ marginTop: 14, width: '100%' }}
                  />
                </View>
              )}

              {/* Error State */}
              {state === 'error' && (
                <View style={styles.centerBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.statusTitle}>خطا در بررسی به‌روزرسانی</Text>
                  <Text style={styles.errorText}>
                    {errorMessage || 'امکان برقراری ارتباط با مخزن برنامه وجود ندارد.'}
                  </Text>
                  <View style={styles.btnRow}>
                    {onRetryCheck && (
                      <RetroButton
                        label="تلاش مجدد 🔄"
                        variant="secondary"
                        onPress={onRetryCheck}
                        size="sm"
                        style={{ flex: 1 }}
                      />
                    )}
                    <RetroButton
                      label="بستن"
                      variant="primary"
                      onPress={onClose}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}

              {/* Update Available State */}
              {state === 'available' && releaseInfo && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {/* Header alert card */}
                  <View style={styles.updateCardHeader}>
                    <View style={styles.versionBadges}>
                      <RetroBadge
                        label={`نسخه جدید: ${releaseInfo.version}`}
                        color={COLORS.green}
                      />
                      <RetroBadge
                        label={`فعلی: ${CURRENT_APP_VERSION}`}
                        color={COLORS.cream}
                      />
                    </View>
                    <Text style={styles.releaseTitle}>{releaseInfo.title}</Text>
                    {releaseInfo.publishedAt ? (
                      <Text style={styles.releaseDate}>
                        تاریخ انتشار: {releaseInfo.publishedAt}
                      </Text>
                    ) : null}
                  </View>

                  {/* Release Notes */}
                  <Text style={styles.sectionHeading}>تغییرات و قابلیت‌های جدید:</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{releaseInfo.releaseNotes}</Text>
                  </View>

                  {/* Download Progress Bar if active */}
                  {downloadProgress !== null && (
                    <View style={styles.downloadProgressSection}>
                      <Text style={styles.downloadLabel}>
                        در حال انتقال به صفحه دانلود ({toPersianDigits(downloadProgress)}٪)...
                      </Text>
                      <RetroProgressBar
                        percentage={downloadProgress}
                        blockColor={COLORS.green}
                        style={{ marginTop: 4 }}
                      />
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actionButtons}>
                    <RetroButton
                      label="دریافت و به‌روزرسانی خودکار 📥"
                      variant="primary"
                      onPress={handleStartUpdate}
                      size="md"
                    />

                    <RetroButton
                      label="بعداً یادآوری کن"
                      variant="secondary"
                      onPress={onClose}
                      size="sm"
                    />
                  </View>
                </ScrollView>
              )}
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
    padding: 2,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.black,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.grayDark,
    textAlign: 'center',
    lineHeight: 18,
  },
  badgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7F5DC',
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLargeText: {
    fontSize: 24,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#A82820',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    width: '100%',
  },
  updateCardHeader: {
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 10,
    ...RETRO_SHADOW.sm,
  },
  versionBadges: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 6,
  },
  releaseTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
  },
  releaseDate: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'right',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'right',
  },
  notesBox: {
    backgroundColor: COLORS.cream,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 12,
    minHeight: 70,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.black,
    lineHeight: 18,
    textAlign: 'right',
  },
  downloadProgressSection: {
    marginBottom: 12,
  },
  downloadLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 8,
    marginTop: 4,
  },
});
