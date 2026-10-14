import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RetroWindow } from '../common/RetroWindow';
import { RetroInput } from '../common/RetroInput';
import { RetroButton } from '../common/RetroButton';
import { FridgeLogoIcon } from '../icons/RetroIcons';
import { COLORS } from '../../constants/theme';

interface FridgeNameFormProps {
  currentName: string;
  onSaveName: (name: string) => void;
}

export const FridgeNameForm: React.FC<FridgeNameFormProps> = ({
  currentName,
  onSaveName,
}) => {
  const [fridgeName, setFridgeName] = useState(currentName);

  const handleSave = () => {
    const trimmed = fridgeName.trim();
    if (trimmed.length > 0) {
      onSaveName(trimmed);
    }
  };

  return (
    <RetroWindow title="نام یخچال" subtitle="شناسنامه سیستم">
      <View style={styles.formContent}>
        <View style={styles.inputSection}>
          <RetroInput
            value={fridgeName}
            onChangeText={setFridgeName}
            placeholder="مثلاً یخچال خونه ما"
            icon={<FridgeLogoIcon size={20} color={COLORS.orange} />}
            inputStyle={styles.customInput}
          />
        </View>

        <View style={styles.actionRow}>
          <RetroButton
            label="ثبت نام یخچال"
            variant="primary"
            onPress={handleSave}
            size="sm"
            style={styles.saveBtn}
          />
          {currentName ? (
            <View style={styles.activeLabelBox}>
              <Text style={styles.activeLabel}>فعال: {currentName}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </RetroWindow>
  );
};

const styles = StyleSheet.create({
  formContent: {
    paddingVertical: 4,
  },
  inputSection: {
    marginBottom: 6,
  },
  customInput: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  saveBtn: {
    minWidth: 120,
  },
  activeLabelBox: {
    backgroundColor: COLORS.bgLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
  },
});
