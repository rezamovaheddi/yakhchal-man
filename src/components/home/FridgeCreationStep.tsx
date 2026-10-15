import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RetroWindow } from '../common/RetroWindow';
import { RetroInput } from '../common/RetroInput';
import { RetroButton } from '../common/RetroButton';
import { FridgeLogoIcon } from '../icons/RetroIcons';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface FridgeCreationStepProps {
  currentName: string;
  onBuildFridge: (name: string, model: string) => void;
  onNextStep?: () => void;
  isAlreadyCreated?: boolean;
}

const PRESET_NAMES = [
  'یخچال خونه ما 🏠',
  'یخچال مجردی 🍕',
  'یخچال محل کار 🏢',
  'یخچال هوشمند ❄️',
];

const FRIDGE_MODELS = [
  { id: 'classic', label: 'رترو کلاسیک ❄️' },
  { id: 'side', label: 'ساید بای ساید 🧊' },
  { id: 'mini', label: 'مینی‌بار نقلی 🥛' },
];

export const FridgeCreationStep: React.FC<FridgeCreationStepProps> = ({
  currentName,
  onBuildFridge,
  onNextStep,
  isAlreadyCreated = false,
}) => {
  const [name, setName] = useState(currentName || 'یخچال خونه ما');
  const [selectedModel, setSelectedModel] = useState('classic');
  const [error, setError] = useState('');

  const handleBuild = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('لطفاً نامی برای یخچال خود وارد کنید.');
      return;
    }
    setError('');
    const modelObj = FRIDGE_MODELS.find((m) => m.id === selectedModel);
    onBuildFridge(trimmed, modelObj?.label || 'کلاسیک');
  };

  return (
    <RetroWindow
      title="گام ۱: ساخت و راه‌اندازی یخچال"
      subtitle="شناسنامه سیستم"
      headerColor={COLORS.orange}
    >
      <View style={styles.container}>
        {/* Retro Wizard Banner */}
        <View style={styles.wizardBanner}>
          <View style={styles.fridgeIconBadge}>
            <FridgeLogoIcon size={36} color={COLORS.orange} />
          </View>
          <View style={styles.wizardTextCol}>
            <Text style={styles.wizardHeading}>به دستیار آشپزخانه خوش آمدید!</Text>
            <Text style={styles.wizardSub}>
              ابتدا یخچال خود را نام‌گذاری و راه‌اندازی کنید تا وارد مرحله انتخاب اقلام شوید.
            </Text>
          </View>
        </View>

        {/* Fridge Name Input */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>نام یخچال اختصاصی شما:</Text>
          <RetroInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError('');
            }}
            placeholder="مثلاً: یخچال خونه ما"
            icon={<FridgeLogoIcon size={20} color={COLORS.orange} />}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Quick Name Presets */}
        <View style={styles.presetsGroup}>
          <Text style={styles.presetsLabel}>انتخاب سریع از الگوها:</Text>
          <View style={styles.presetChipsRow}>
            {PRESET_NAMES.map((preset) => {
              const clean = preset.replace(/\s[^\s]+$/, '');
              const isSelected = name.includes(clean);
              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    setName(clean);
                    if (error) setError('');
                  }}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Model Selection */}
        <View style={styles.modelsGroup}>
          <Text style={styles.presetsLabel}>مدل یخچال:</Text>
          <View style={styles.modelsRow}>
            {FRIDGE_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <Pressable
                  key={model.id}
                  onPress={() => setSelectedModel(model.id)}
                  style={[
                    styles.modelCard,
                    isSelected && styles.modelCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modelCardText,
                      isSelected && styles.modelCardTextActive,
                    ]}
                  >
                    {model.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <RetroButton
            label={isAlreadyCreated ? 'ذخیره و رفتن به انتخاب اقلام ⬅️' : '❄️ ساخت یخچال و انتخاب اقلام ⬅️'}
            variant="primary"
            onPress={handleBuild}
            size="lg"
            style={styles.buildButton}
          />

          {isAlreadyCreated && onNextStep && (
            <RetroButton
              label="ادامه با همین یخچال بدون تغییر"
              variant="secondary"
              onPress={onNextStep}
              size="sm"
              style={styles.cancelButton}
            />
          )}
        </View>
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  wizardBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 14,
    ...RETRO_SHADOW.sm,
  },
  fridgeIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  wizardHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
    marginBottom: 2,
  },
  wizardSub: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.red,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  presetsGroup: {
    marginBottom: 12,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 6,
    textAlign: 'right',
  },
  presetChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presetChipActive: {
    backgroundColor: COLORS.yellow,
    ...RETRO_SHADOW.sm,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  presetChipTextActive: {
    fontWeight: '900',
  },
  modelsGroup: {
    marginBottom: 16,
  },
  modelsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  modelCard: {
    flex: 1,
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelCardActive: {
    backgroundColor: COLORS.lavender,
    borderWidth: 2,
    ...RETRO_SHADOW.sm,
  },
  modelCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  modelCardTextActive: {
    fontWeight: '900',
  },
  actionContainer: {
    gap: 8,
    marginTop: 4,
  },
  buildButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});
