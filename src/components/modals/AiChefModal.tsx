import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ingredient } from '../../types';
import { RetroWindow } from '../common/RetroWindow';
import { RetroButton } from '../common/RetroButton';
import { RetroBadge } from '../common/RetroBadge';
import { FoodIconRenderer } from '../icons/FoodIcons';
import {
  RetroClockIcon,
  RetroBulbIcon,
  RetroSparkleIcon,
  RetroRefreshIcon,
} from '../icons/RetroIcons';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getAiRecipeSuggestions,
  AiRecipeSuggestion,
  AiRecipeResponse,
} from '../../services/aiRecipeService';
import { toPersianDigits } from '../../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';

interface AiChefModalProps {
  visible: boolean;
  inventory: Ingredient[];
  onClose: () => void;
}

const LOADING_MESSAGES = [
  '🔍 در حال بررسی اقلام موجود در یخچال شما...',
  '🧠 ارسال به سرور بک‌اند و مشورت با هوش مصنوعی...',
  '🍲 سنجش بهترین ترکیب طعم‌ها و کمترین دورریز...',
  '📝 آماده‌سازی ۳ دستور پخت اختصاصی و لذیذ...',
];

const PREFERENCE_PRESETS = [
  'غذای نونی و سریع',
  'رژیمی و کم‌کالری',
  'خوراک سنتی ایرانی',
  'آشپزی با کمترین مواد',
];

export const AiChefModal: React.FC<AiChefModalProps> = ({
  visible,
  inventory,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AiRecipeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'backend' | 'direct_gemini' | null>(null);
  const [selectedPreference, setSelectedPreference] = useState<string>('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotating loading messages
  useEffect(() => {
    if (loading) {
      setLoadingMsgIndex(0);
      timerRef.current = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  // Auto-fetch if opened and no suggestions yet
  useEffect(() => {
    if (visible && suggestions.length === 0 && !loading && !error && inventory.length > 0) {
      fetchSuggestions();
    }
  }, [visible]);

  const fetchSuggestions = async (prefOverride?: string) => {
    if (inventory.length === 0) {
      setError('یخچال شما خالی است! لطفاً ابتدا چند قلم کالا به یخچال اضافه کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    setExpandedId(null);

    const preferenceToUse = prefOverride !== undefined ? prefOverride : selectedPreference;

    try {
      const response: AiRecipeResponse = await getAiRecipeSuggestions(
        inventory,
        preferenceToUse || undefined
      );

      if (response.success && response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        setSource(response.source || 'backend');
        // Auto-expand the first recipe for great UX
        if (response.suggestions[0]) {
          setExpandedId(response.suggestions[0].id);
        }
      } else {
        setError(response.error || 'خطایی در تولید دستورهای غذایی رخ داد.');
      }
    } catch (err: any) {
      setError(err?.message || 'ارتباط با سرور هوش مصنوعی برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSelectPreference = (preset: string) => {
    const nextPref = selectedPreference === preset ? '' : preset;
    setSelectedPreference(nextPref);
    fetchSuggestions(nextPref);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <RetroWindow
            title="سرآشپز هوش مصنوعی 🤖"
            subtitle="۳ پیشنهاد غذا با اقلام یخچال شما"
            headerColor={COLORS.orange}
            onClose={onClose}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              style={{ maxHeight: 520 }}
            >
              {/* Top Fridge Summary Bar */}
              <View style={styles.fridgeSummary}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.summaryLabel}>اقلام بررسی شده:</Text>
                    <Text style={styles.summaryValue}>
                      {toPersianDigits(inventory.length)} قلم کالا
                    </Text>
                  </View>
                  <View style={styles.summaryRight}>
                    <MaterialCommunityIcons name="fridge-outline" size={20} color={COLORS.orangeDark} />
                  </View>
                </View>
                <Text style={styles.summarySubtext} numberOfLines={1}>
                  {inventory.slice(0, 5).map((i) => i.name).join('، ') +
                    (inventory.length > 5 ? ' و...' : '')}
                </Text>
              </View>

              {/* Preference Filters */}
              <View style={styles.presetsSection}>
                <Text style={styles.presetsTitle}>نوع سلیقه یا نیاز خاص (اختیاری):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {PREFERENCE_PRESETS.map((preset) => {
                    const isSelected = selectedPreference === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        activeOpacity={0.7}
                        disabled={loading}
                        onPress={() => handleSelectPreference(preset)}
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
                          {isSelected ? '✓ ' : ''}{preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* LOADING STATE */}
              {loading && (
                <View style={styles.loadingBox}>
                  <View style={styles.retroTerminalHeader}>
                    <Text style={styles.terminalTitle}>C:\AI_CHEF\GEMINI_LLM.EXE</Text>
                    <ActivityIndicator size="small" color={COLORS.orange} />
                  </View>
                  <View style={styles.terminalBody}>
                    <Text style={styles.terminalCursor}>&gt; {LOADING_MESSAGES[loadingMsgIndex]}</Text>
                    <View style={styles.retroProgressTrack}>
                      <View
                        style={[
                          styles.retroProgressBar,
                          { width: `${((loadingMsgIndex + 1) / LOADING_MESSAGES.length) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.terminalHint}>
                      هوش مصنوعی در حال تحلیل مقادیر و ماندگاری مواد غذایی است...
                    </Text>
                  </View>
                </View>
              )}

              {/* ERROR STATE */}
              {!loading && error && (
                <View style={styles.errorBox}>
                  <View style={styles.errorHeader}>
                    <Ionicons name="alert-circle" size={24} color={COLORS.red} />
                    <Text style={styles.errorTitle}>خطا در دریافت پیشنهادها</Text>
                  </View>
                  <Text style={styles.errorMessage}>{error}</Text>
                  <View style={styles.errorActions}>
                    <RetroButton
                      label="تلاش مجدد 🔄"
                      variant="primary"
                      onPress={() => fetchSuggestions()}
                    />
                  </View>
                </View>
              )}

              {/* SUCCESS / RESULTS STATE */}
              {!loading && !error && suggestions.length > 0 && (
                <View style={styles.resultsArea}>
                  {/* Source indicator */}
                  <View style={styles.sourceBadgeRow}>
                    <View style={styles.sourceBadge}>
                      <Ionicons
                        name={source === 'backend' ? 'server-outline' : 'sparkles-outline'}
                        size={13}
                        color={COLORS.grayDark}
                      />
                      <Text style={styles.sourceText}>
                        {source === 'backend'
                          ? 'پاسخ از بک‌اند سرور پورتی (Node Express)'
                          : 'پاسخ مستقیم از مدل Gemini 3.5'}
                      </Text>
                    </View>
                    <Text style={styles.resultCountBadge}>
                      {toPersianDigits(suggestions.length)} پیشنهاد غذا
                    </Text>
                  </View>

                  {/* 3 Recipe Cards */}
                  {suggestions.map((recipe, index) => {
                    const isExpanded = expandedId === recipe.id;
                    return (
                      <View key={recipe.id} style={styles.recipeCard}>
                        {/* Recipe Header */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleToggleExpand(recipe.id)}
                          style={styles.recipeHeader}
                        >
                          <View style={styles.recipeIconWrap}>
                            <FoodIconRenderer iconName={recipe.iconName || 'cooking'} size={32} />
                          </View>

                          <View style={styles.recipeMainInfo}>
                            <View style={styles.recipeNumberRow}>
                              <Text style={styles.recipeNumberBadge}>
                                پیشنهاد {toPersianDigits(index + 1)}
                              </Text>
                              <Text style={styles.categoryBadgeText}>
                                {recipe.category || 'غذای خانگی'}
                              </Text>
                            </View>
                            <Text style={styles.recipeTitle}>{recipe.title}</Text>
                          </View>

                          <View style={styles.chevronWrap}>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={COLORS.black}
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Description */}
                        <Text style={styles.recipeDesc}>{recipe.description}</Text>

                        {/* Badges Row: Time, Difficulty */}
                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.orangeDark} />
                            <Text style={styles.metaText}>
                              {toPersianDigits(recipe.prepTime)}
                            </Text>
                          </View>

                          <View style={styles.metaItem}>
                            <Ionicons name="speedometer-outline" size={14} color={COLORS.grayDark} />
                            <Text style={styles.metaText}>{recipe.difficulty}</Text>
                          </View>
                        </View>

                        {/* Ingredients: In Fridge */}
                        <View style={styles.ingredientsSection}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                            <Text style={styles.sectionTitle}>مواد موجود در یخچال:</Text>
                          </View>
                          <View style={styles.tagsContainer}>
                            {recipe.matchedIngredients.map((item, i) => (
                              <View key={i} style={styles.matchedTag}>
                                <Text style={styles.matchedTagText}>✓ {item}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Ingredients: Missing/Need to add */}
                        {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                          <View style={styles.ingredientsSection}>
                            <View style={styles.sectionHeader}>
                              <Ionicons name="add-circle-outline" size={14} color={COLORS.red} />
                              <Text style={styles.sectionTitle}>مواد تکمیلی مورد نیاز:</Text>
                            </View>
                            <View style={styles.tagsContainer}>
                              {recipe.missingIngredients.map((item, i) => (
                                <View key={i} style={styles.missingTag}>
                                  <Text style={styles.missingTagText}>+ {item}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* EXPANDED INSTRUCTIONS */}
                        {isExpanded ? (
                          <View style={styles.instructionsBox}>
                            <View style={styles.instructionsHeader}>
                              <MaterialCommunityIcons name="pot-steam" size={16} color={COLORS.orangeDark} />
                              <Text style={styles.instructionsTitle}>دستور گام‌به‌گام پخت:</Text>
                            </View>
                            {recipe.instructions.map((step, sIndex) => (
                              <View key={sIndex} style={styles.stepRow}>
                                <View style={styles.stepNumberBadge}>
                                  <Text style={styles.stepNumberText}>
                                    {toPersianDigits(sIndex + 1)}
                                  </Text>
                                </View>
                                <Text style={styles.stepText}>{step}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleToggleExpand(recipe.id)}
                            style={styles.expandButton}
                          >
                            <Text style={styles.expandButtonText}>مشاهده مراحل آماده‌سازی و پخت 👇</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions Footer */}
            <View style={styles.footerRow}>
              <RetroButton
                label="تولید ۳ پیشنهاد جدید 🔄"
                variant="primary"
                onPress={() => fetchSuggestions()}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <RetroButton
                label="بستن"
                variant="secondary"
                onPress={onClose}
                style={{ minWidth: 70 }}
              />
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
  },
  scrollContent: {
    padding: 12,
  },
  fridgeSummary: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
    marginBottom: 10,
    ...RETRO_SHADOW.sm,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
  },
  summaryRight: {},
  summarySubtext: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
    marginTop: 4,
  },
  presetsSection: {
    marginBottom: 12,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: 'row-reverse',
  },
  presetChip: {
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.thin,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 6,
  },
  presetChipActive: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.orangeDark,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.black,
    fontWeight: '600',
  },
  presetChipTextActive: {
    fontWeight: '800',
    color: COLORS.black,
  },
  loadingBox: {
    backgroundColor: '#0F172A',
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    marginVertical: 14,
    ...RETRO_SHADOW.md,
  },
  retroTerminalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
    marginBottom: 8,
  },
  terminalTitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  terminalBody: {
    paddingVertical: 4,
  },
  terminalCursor: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 10,
  },
  retroProgressTrack: {
    height: 12,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
    marginBottom: 8,
  },
  retroProgressBar: {
    height: '100%',
    backgroundColor: COLORS.orange,
  },
  terminalHint: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderWidth: BORDER.regular,
    borderColor: COLORS.red,
    borderRadius: BORDER.radiusSm,
    padding: 14,
    marginVertical: 12,
  },
  errorHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.red,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.black,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12,
  },
  errorActions: {
    alignItems: 'center',
  },
  resultsArea: {},
  sourceBadgeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  resultCountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 3,
  },
  recipeCard: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    marginBottom: 14,
    ...RETRO_SHADOW.sm,
  },
  recipeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.thin,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  recipeMainInfo: {
    flex: 1,
  },
  recipeNumberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recipeNumberBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.orangeDark,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: COLORS.grayDark,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'right',
  },
  chevronWrap: {
    padding: 4,
  },
  recipeDesc: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.grayLight,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  ingredientsSection: {
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
  },
  matchedTag: {
    backgroundColor: '#EAF5EA',
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  matchedTagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
  missingTag: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  missingTagText: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '600',
  },
  expandButton: {
    marginTop: 6,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  instructionsBox: {
    marginTop: 8,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 6,
    padding: 10,
  },
  instructionsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.black,
    textAlign: 'right',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderTopWidth: BORDER.regular,
    borderTopColor: COLORS.black,
    backgroundColor: COLORS.bgLight,
  },
});
