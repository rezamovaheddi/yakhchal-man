import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { RetroWindow } from '../common/RetroWindow';
import { RetroInput } from '../common/RetroInput';
import { RetroButton } from '../common/RetroButton';
import { AvatarRenderer, AVATAR_OPTIONS } from '../icons/AvatarIcons';
import { UserAccount } from '../../types';
import { authStorage } from '../../utils/authStorage';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount, mode: 'login' | 'register') => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);

  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState('chef');
  const [regFridgeName, setRegFridgeName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setLoginUsername('');
    setLoginPassword('');
    setRegName('');
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegAvatar('chef');
    setRegFridgeName('');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLoginSubmit = async () => {
    setErrorMessage('');
    if (!loginUsername.trim() || !loginPassword) {
      setErrorMessage('لطفاً نام کاربری و کلمه عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    const res = await authStorage.login(loginUsername, loginPassword);
    setIsLoading(false);

    if (res.success && res.user) {
      handleClose();
      onAuthSuccess(res.user, 'login');
    } else {
      setErrorMessage(res.error || 'خطا در ورود به حساب کاربری.');
    }
  };

  const handleRegisterSubmit = async () => {
    setErrorMessage('');
    if (!regName.trim()) {
      setErrorMessage('لطفاً نام خود را وارد کنید.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage('لطفاً نام کاربری یا ایمیل را وارد کنید.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('رمز عبور باید حداقل ۴ نویسه باشد.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('رمز عبور با تکرار آن یکسان نیست.');
      return;
    }

    setIsLoading(true);
    const res = await authStorage.register({
      name: regName.trim(),
      username: regUsername.trim(),
      password: regPassword,
      avatar: regAvatar,
      fridgeName: regFridgeName.trim() || `یخچال ${regName.trim()}`,
    });
    setIsLoading(false);

    if (res.success && res.user) {
      handleClose();
      onAuthSuccess(res.user, 'register');
    } else {
      setErrorMessage(res.error || 'خطا در ثبت‌نام.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <RetroWindow
            title={tab === 'login' ? 'ورود به حساب کاربری' : 'ساخت حساب کاربری جدید'}
            subtitle="سیستم امنیت و شناسنامه کاربر"
            onClose={handleClose}
            headerColor={tab === 'login' ? COLORS.green : COLORS.orange}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tab Switcher */}
              <View style={styles.tabsRow}>
                <Pressable
                  onPress={() => {
                    setTab('login');
                    setErrorMessage('');
                  }}
                  style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                    ورود به حساب
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setTab('register');
                    setErrorMessage('');
                  }}
                  style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                    ثبت‌نام جدید
                  </Text>
                </Pressable>
              </View>

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              ) : null}

              {/* Login View */}
              {tab === 'login' && (
                <View style={styles.formContent}>
                  <RetroInput
                    label="نام کاربری یا ایمیل:"
                    value={loginUsername}
                    onChangeText={(t) => {
                      setLoginUsername(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="مثلاً: reza یا reza@gmail.com"
                    autoCapitalize="none"
                  />

                  <RetroInput
                    label="رمز عبور:"
                    value={loginPassword}
                    onChangeText={(t) => {
                      setLoginPassword(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                    placeholder="••••••••"
                  />

                  <View style={styles.actionButtons}>
                    <RetroButton
                      label={isLoading ? 'در حال ورود...' : 'ورود به سیستم 🔑'}
                      variant="green"
                      onPress={handleLoginSubmit}
                      disabled={isLoading}
                      size="md"
                    />

                    <Pressable
                      onPress={() => {
                        setTab('register');
                        setErrorMessage('');
                      }}
                      style={styles.switchPrompt}
                    >
                      <Text style={styles.switchPromptText}>
                        هنوز حساب ندارید؟ <Text style={styles.switchHighlight}>ثبت‌نام کنید</Text>
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Register View */}
              {tab === 'register' && (
                <View style={styles.formContent}>
                  <RetroInput
                    label="نام و نام خانوادگی:"
                    value={regName}
                    onChangeText={(t) => {
                      setRegName(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="مثلاً: رضا موحدی"
                  />

                  <RetroInput
                    label="نام کاربری یا ایمیل:"
                    value={regUsername}
                    onChangeText={(t) => {
                      setRegUsername(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="مثلاً: reza_chef"
                    autoCapitalize="none"
                  />

                  {/* Avatar Picker */}
                  <Text style={styles.fieldLabel}>انتخاب آواتار رترو:</Text>
                  <View style={styles.avatarsRow}>
                    {AVATAR_OPTIONS.map((opt) => {
                      const isSelected = regAvatar === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => setRegAvatar(opt.id)}
                          style={[
                            styles.avatarCard,
                            isSelected && styles.avatarCardActive,
                          ]}
                        >
                          <AvatarRenderer avatarId={opt.id} size={32} />
                          <Text
                            style={[
                              styles.avatarLabel,
                              isSelected && styles.avatarLabelActive,
                            ]}
                            numberOfLines={1}
                          >
                            {opt.label.split(' ')[0]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <RetroInput
                    label="رمز عبور:"
                    value={regPassword}
                    onChangeText={(t) => {
                      setRegPassword(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                    placeholder="حداقل ۴ نویسه"
                  />

                  <RetroInput
                    label="تکرار رمز عبور:"
                    value={regConfirmPassword}
                    onChangeText={(t) => {
                      setRegConfirmPassword(t);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                    placeholder="تکرار رمز عبور"
                  />

                  <RetroInput
                    label="نام اختصاصی یخچال شما (اختیاری):"
                    value={regFridgeName}
                    onChangeText={setRegFridgeName}
                    placeholder="مثلاً: یخچال اختصاصی رضا"
                  />

                  <View style={styles.actionButtons}>
                    <RetroButton
                      label={isLoading ? 'در حال ساخت حساب...' : 'ساخت حساب کاربری ✨'}
                      variant="primary"
                      onPress={handleRegisterSubmit}
                      disabled={isLoading}
                      size="md"
                    />

                    <Pressable
                      onPress={() => {
                        setTab('login');
                        setErrorMessage('');
                      }}
                      style={styles.switchPrompt}
                    >
                      <Text style={styles.switchPromptText}>
                        قبلاً ثبت‌نام کرده‌اید؟ <Text style={styles.switchHighlight}>وارد شوید</Text>
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
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
    maxWidth: 390,
    maxHeight: '90%',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    ...RETRO_SHADOW.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.yellow,
    borderWidth: BORDER.thick,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  tabBtnTextActive: {
    fontWeight: '900',
  },
  errorBox: {
    backgroundColor: '#FFE3E0',
    borderWidth: 1.5,
    borderColor: COLORS.red,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.red,
    textAlign: 'right',
  },
  formContent: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'right',
  },
  avatarsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  avatarCard: {
    flex: 1,
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCardActive: {
    backgroundColor: COLORS.yellow,
    borderWidth: 2.5,
    ...RETRO_SHADOW.sm,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.grayDark,
    marginTop: 2,
    textAlign: 'center',
  },
  avatarLabelActive: {
    color: COLORS.black,
    fontWeight: '900',
  },
  actionButtons: {
    marginTop: 8,
    gap: 8,
  },
  switchPrompt: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  switchPromptText: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontWeight: '600',
  },
  switchHighlight: {
    color: COLORS.black,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
