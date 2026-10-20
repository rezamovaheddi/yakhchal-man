import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { toPersianDigits } from '../../utils/persian';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export type HomeStep = 'build_fridge' | 'select_items' | 'suggestion_and_items';

interface StepWizardBarProps {
  currentStep: HomeStep;
  onSelectStep: (step: HomeStep) => void;
  isFridgeCreated: boolean;
  selectedItemsCount: number;
}

export const StepWizardBar: React.FC<StepWizardBarProps> = ({
  currentStep,
  onSelectStep,
  isFridgeCreated,
  selectedItemsCount,
}) => {
  const steps: {
    key: HomeStep;
    label: string;
    stepNumber: number;
    enabled: boolean;
    icon: (color: string) => React.ReactNode;
  }[] = [
    {
      key: 'build_fridge',
      label: '۱. ساخت یخچال',
      stepNumber: 1,
      enabled: true,
      icon: (color) => <MaterialCommunityIcons name="fridge-outline" size={13} color={color} />,
    },
    {
      key: 'select_items',
      label: '۲. انتخاب اقلام',
      stepNumber: 2,
      enabled: isFridgeCreated,
      icon: (color) => <MaterialCommunityIcons name="format-list-checks" size={13} color={color} />,
    },
    {
      key: 'suggestion_and_items',
      label: '۳. پیشنهاد غذا',
      stepNumber: 3,
      enabled: isFridgeCreated && selectedItemsCount > 0,
      icon: (color) => <MaterialCommunityIcons name="pot-steam-outline" size={13} color={color} />,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isDone =
            (step.key === 'build_fridge' && isFridgeCreated) ||
            (step.key === 'select_items' && currentStep === 'suggestion_and_items');
          const iconColor = isActive ? COLORS.black : COLORS.grayDark;

          return (
            <Pressable
              key={step.key}
              disabled={!step.enabled}
              onPress={() => onSelectStep(step.key)}
              style={({ pressed }) => [
                styles.stepItem,
                isActive && styles.stepItemActive,
                isDone && !isActive && styles.stepItemDone,
                !step.enabled && styles.stepItemDisabled,
                pressed && step.enabled && styles.stepItemPressed,
              ]}
            >
              <View style={styles.stepContentRow}>
                {isDone && !isActive ? (
                  <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                ) : (
                  step.icon(iconColor)
                )}
                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.stepTextActive,
                    isDone && !isActive && styles.stepTextDone,
                    !step.enabled && styles.stepTextDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  stepsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    backgroundColor: COLORS.creamInput,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    ...RETRO_SHADOW.sm,
  },
  stepContentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stepItemActive: {
    backgroundColor: COLORS.orange,
  },
  stepItemDone: {
    backgroundColor: COLORS.yellow,
  },
  stepItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#E6DEC8',
    elevation: 0,
    shadowOpacity: 0,
  },
  stepItemPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    elevation: 0,
    shadowOpacity: 0,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  stepTextActive: {
    fontWeight: '900',
    color: COLORS.black,
  },
  stepTextDone: {
    fontWeight: '800',
    color: COLORS.black,
  },
  stepTextDisabled: {
    color: COLORS.grayDark,
  },
});
