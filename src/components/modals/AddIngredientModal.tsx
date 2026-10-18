import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ingredient, IngredientCategory, IngredientUnit, StorageLocation } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroInput } from '../common/RetroInput';
import { RetroButton } from '../common/RetroButton';
import { FoodIconRenderer } from '../icons/FoodIcons';
import { getFutureDateString, DEFAULT_INGREDIENT_PRICES } from '../../utils/antiWasteEngine';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface AddIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (newIngredient: Omit<Ingredient, 'id'>) => void;
}

const AVAILABLE_ICONS = [
  'egg',
  'tomato',
  'potato',
  'cheese',
  'milk',
  'onion',
  'garlic',
  'carrot',
  'mushroom',
  'chicken',
  'butter',
  'bread',
];
const UNITS: IngredientUnit[] = ['عدد', 'بسته', 'لیتر', 'کیلوگرم', 'حبه'];
const CATEGORIES: IngredientCategory[] = [
  'سبزیجات',
  'لبنیات',
  'پروتئین',
  'ادویه و چاشنی',
  'سایر',
];
const LOCATIONS: StorageLocation[] = ['یخچال', 'فریزر', 'کابینت'];

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<IngredientUnit>('عدد');
  const [category, setCategory] = useState<IngredientCategory>('سبزیجات');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('یخچال');
  const [daysToExpiry, setDaysToExpiry] = useState('5');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tomato');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('لطفاً نام ماده غذایی را وارد کنید');
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('مقدار باید حداقل ۱ باشد');
      return;
    }

    const parsedDays = parseInt(daysToExpiry, 10);
    const expiryDate = !isNaN(parsedDays)
      ? getFutureDateString(parsedDays)
      : getFutureDateString(5);

    const parsedPrice = parseInt(estimatedPrice, 10);
    const finalPrice = !isNaN(parsedPrice) && parsedPrice > 0
      ? parsedPrice
      : (DEFAULT_INGREDIENT_PRICES[name.trim()] ?? 25000);

    onAdd({
      name: name.trim(),
      quantity: parsedQty,
      unit,
      category,
      iconName: selectedIcon,
      storageLocation,
      expiryDate,
      estimatedPrice: finalPrice,
    });

    // Reset and close
    setName('');
    setQuantity('1');
    setDaysToExpiry('5');
    setEstimatedPrice('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <RetroWindow
            title="افزودن به یخچال"
            subtitle="فرم ورودی رترو"
            onClose={onClose}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <RetroInput
                label="نام ماده غذایی:"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError('');
                }}
                placeholder="مثلاً قارچ تازه، هویج..."
              />

              {/* Quantity and Unit in a row */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <RetroInput
                    label="تعداد یا مقدار:"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="۱"
                  />
                </View>
              </View>

              {/* Unit selection chips */}
              <Text style={styles.sectionLabel}>واحد شمارش:</Text>
              <View style={styles.chipsRow}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    style={[
                      styles.chip,
                      unit === u && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        unit === u && styles.chipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Storage Location selection */}
              <Text style={styles.sectionLabel}>محل نگهداری:</Text>
              <View style={styles.chipsRow}>
                {LOCATIONS.map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => setStorageLocation(loc)}
                    style={[
                      styles.chip,
                      storageLocation === loc && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        storageLocation === loc && styles.chipTextActive,
                      ]}
                    >
                      {loc === 'یخچال' ? '❄️ یخچال' : loc === 'فریزر' ? '🧊 فریزر' : '🚪 کابینت'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Shelf-life & Price row */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <RetroInput
                    label="ماندگاری (روز):"
                    value={daysToExpiry}
                    onChangeText={setDaysToExpiry}
                    keyboardType="numeric"
                    placeholder="۵"
                  />
                </View>
                <View style={{ flex: 1.2 }}>
                  <RetroInput
                    label="ارزش تقریبی (تومان):"
                    value={estimatedPrice}
                    onChangeText={setEstimatedPrice}
                    keyboardType="numeric"
                    placeholder="مثلاً ۲۵۰۰۰"
                  />
                </View>
              </View>

              {/* Category selection */}
              <Text style={styles.sectionLabel}>دسته‌بندی:</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.chip,
                      category === c && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === c && styles.chipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Icon selector */}
              <Text style={styles.sectionLabel}>انتخاب آیکون رترو:</Text>
              <View style={styles.iconRow}>
                {AVAILABLE_ICONS.map((iconKey) => (
                  <Pressable
                    key={iconKey}
                    onPress={() => setSelectedIcon(iconKey)}
                    style={[
                      styles.iconSelectBox,
                      selectedIcon === iconKey && styles.iconSelectBoxActive,
                    ]}
                  >
                    <FoodIconRenderer iconName={iconKey} size={28} />
                  </Pressable>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <RetroButton
                  label="ثبت در یخچال"
                  variant="primary"
                  onPress={handleSubmit}
                  size="md"
                  style={{ flex: 1.2 }}
                />
                <RetroButton
                  label="انصراف"
                  variant="secondary"
                  onPress={onClose}
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
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
    backgroundColor: 'rgba(23, 20, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipActive: {
    backgroundColor: COLORS.yellow,
    ...RETRO_SHADOW.sm,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  chipTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  iconRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  iconSelectBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectBoxActive: {
    backgroundColor: COLORS.orange,
    borderWidth: 2.5,
    ...RETRO_SHADOW.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red,
    textAlign: 'right',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
});
