import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ingredient, UserAccount } from '../types';
import { RetroWindow } from '../components/common/RetroWindow';
import { RetroButton } from '../components/common/RetroButton';
import { RetroBadge } from '../components/common/RetroBadge';
import { FoodIconRenderer } from '../components/icons/FoodIcons';
import {
  RetroBulbIcon,
  RetroSparkleIcon,
  RetroRefreshIcon,
  RetroSnowflakeIcon,
} from '../components/icons/RetroIcons';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getAiRecipeSuggestions,
  syncFridgeToDatabase,
  AiRecipeSuggestion,
  AiRecipeResponse,
} from '../services/aiRecipeService';
import { toPersianDigits } from '../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../constants/theme';

interface AiChefScreenProps {
  inventory: Ingredient[];
  fridgeName: string;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
}

const LOADING_MESSAGES = [
  '🔍 در حال اسکن اقلام یخچال و ثبت در دیتابیس...',
  '🧠 اتصال به سرور بک‌اند و تحلیل هوش مصنوعی (Gemini LLM)...',
  '🍲 سنجش بهترین ترکیب طعم‌ها و زمان پخت بهینه...',
  '📝 آماده‌سازی ۳ دستور پخت اختصاصی برای شما...',
];

const PREFERENCE_PRESETS = [
  'غذای نونی و سریع',
  'رژیمی و کم‌کالری',
  'خوراک سنتی ایرانی',
  'آشپزی با کمترین مواد',
];

export const AiChefScreen: React.FC<AiChefScreenProps> = ({
  inventory,
  fridgeName,
  currentUser,
  onOpenAuth,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AiRecipeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'backend' | 'direct_gemini' | null>(null);
  const [selectedPreference, setSelectedPreference] = useState<string>('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dbSyncMessage, setDbSyncMessage] = useState<string | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSyncDatabase = async () => {
    if (!currentUser) return;
    setIsSyncingDb(true);
    try {
      const res = await syncFridgeToDatabase(currentUser, fridgeName, inventory);
      if (res.success) {
        setDbSyncMessage(`اقلام یخچال در دیتابیس با موفقیت ثبت شد ✓ (${toPersianDigits(inventory.length)} قلم)`);
      } else {
        setDbSyncMessage(`همگام‌سازی ابری ناموفق بود — اقلام فقط روی همین دستگاه ذخیره شد ⚠️`);
      }
    } catch {
      setDbSyncMessage(`همگام‌سازی ابری ناموفق بود — اقلام فقط روی همین دستگاه ذخیره شد ⚠️`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Rotating loading messages
  useEffect(() => {
    if (!loading) return;
    timerRef.current = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  // Sync to database when user logs in or inventory changes. Debounced so a
  // burst of edits (adding several items in a row) coalesces into one request.
  useEffect(() => {
    if (!currentUser || inventory.length === 0) return;
    const syncDelay = setTimeout(() => handleSyncDatabase(), 1500);
    return () => clearTimeout(syncDelay);
  }, [currentUser?.id, inventory.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSuggestions = async (prefOverride?: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (inventory.length === 0) {
      setError('یخچال شما خالی است! لطفاً ابتدا از صفحه اصلی چند قلم کالا به یخچال اضافه کنید.');
      return;
    }

    setLoading(true);
    setLoadingMsgIndex(0);
    setError(null);
    setExpandedId(null);

    const preferenceToUse = prefOverride !== undefined ? prefOverride : selectedPreference;

    try {
      // Note: the backend also syncs the fridge to its database on every
      // /api/ai/suggest request, so no extra sync call is needed here.

      const response: AiRecipeResponse = await getAiRecipeSuggestions(
        inventory,
        preferenceToUse || undefined,
        undefined,
        currentUser,
        fridgeName
      );

      if (response.success && response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        setSource(response.source || 'backend');
        if (response.suggestions[0]) {
          setExpandedId(response.suggestions[0].id);
        }
      } else {
        setError(response.error || 'خطایی در دریافت ۳ پیشنهاد غذا از هوش مصنوعی رخ داد.');
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
    if (currentUser) {
      fetchSuggestions(nextPref);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <RetroWindow
        title="سرآشپز هوش مصنوعی 🤖"
        subtitle="پیشنهاد غذا با مدل Gemini و ثبت در دیتابیس"
        headerColor={COLORS.orange}
      >
        {/* IF USER NOT LOGGED IN: AUTH REQUIRED GATE */}
        {!currentUser ? (
          <View style={styles.authGateCard}>
            <View style={styles.authGateIconWrap}>
              <MaterialCommunityIcons name="shield-lock-outline" size={48} color={COLORS.orange} />
            </View>
            <Text style={styles.authGateTitle}>نیاز به ورود به حساب کاربری 🔒</Text>
            <Text style={styles.authGateDesc}>
              برای استفاده از سرآشپز هوشمند، تحلیل هوش مصنوعی و ثبت دائم اطلاعات یخچال و اقلام غذایی در پایگاه داده، ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.
            </Text>

            <View style={styles.authBenefitsBox}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                <Text style={styles.benefitText}>ثبت نام یخچال و اقلام در پایگاه داده ابری</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                <Text style={styles.benefitText}>۳ پیشنهاد غذای اختصاصی بر اساس مواد موجود</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                <Text style={styles.benefitText}>کاهش دورریز غذا و آموزش گام‌به‌گام پخت</Text>
              </View>
            </View>

            <RetroButton
              label="ورود به حساب یا ثبت‌نام 👤"
              variant="primary"
              size="lg"
              onPress={onOpenAuth}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        ) : (
          /* LOGGED IN USER VIEW */
          <View style={styles.authenticatedContent}>
            {/* User & Database Status Ribbon */}
            <View style={styles.dbRibbonCard}>
              <View style={styles.dbRibbonHeader}>
                <View style={styles.userInfoRow}>
                  <Text style={styles.userAvatarEmoji}>
                    {currentUser.avatar === 'chef' ? '👨‍🍳' : currentUser.avatar === 'cat' ? '🐱' : '👤'}
                  </Text>
                  <View>
                    <Text style={styles.userNameText}>{currentUser.name}</Text>
                    <Text style={styles.userFridgeText}>{fridgeName}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSyncDatabase}
                  disabled={isSyncingDb}
                  style={styles.syncBtn}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={14}
                    color={COLORS.black}
                  />
                  <Text style={styles.syncBtnText}>
                    {isSyncingDb ? 'در حال ثبت...' : 'همگام‌سازی'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* DB Status Message */}
              {dbSyncMessage && (
                <View style={styles.dbStatusRow}>
                  <Ionicons name="server-outline" size={13} color="#2E7D32" />
                  <Text style={styles.dbStatusText}>{dbSyncMessage}</Text>
                </View>
              )}

              {/* Items summary */}
              <View style={styles.inventorySummaryRow}>
                <Text style={styles.inventorySummaryLabel}>اقلام ارسال‌شده به هوش مصنوعی:</Text>
                <Text style={styles.inventorySummaryValue}>
                  {toPersianDigits(inventory.length)} قلم کالا
                </Text>
              </View>
            </View>

            {/* Preference Chips */}
            <View style={styles.presetsSection}>
              <Text style={styles.presetsTitle}>سلیقه یا رژیم پخت (اختیاری):</Text>
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

            {/* Request Button */}
            <RetroButton
              label={suggestions.length > 0 ? "تولید مجدد ۳ پیشنهاد هوشمند 🔄" : "✨ دریافت ۳ پیشنهاد غذا از سرآشپز هوشمند"}
              variant="primary"
              size="lg"
              onPress={() => fetchSuggestions()}
              disabled={loading}
              style={{ marginBottom: 14 }}
            />

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
                    داده‌های یخچال کاربر در دیتابیس ثبت و توسط مدل زبان Gemini پردازش می‌شود...
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

            {/* RESULTS VIEW */}
            {!loading && !error && suggestions.length > 0 && (
              <View style={styles.resultsArea}>
                {/* Source Badge */}
                <View style={styles.sourceBadgeRow}>
                  <View style={styles.sourceBadge}>
                    <Ionicons
                      name={source === 'backend' ? 'server-outline' : 'sparkles-outline'}
                      size={14}
                      color={COLORS.grayDark}
                    />
                    <Text style={styles.sourceText}>
                      {source === 'backend'
                        ? 'پاسخ از سرور ابری بک‌اند (Node Express ⚡)'
                        : 'پاسخ مستقیم از مدل Gemini 3.5 ✨'}
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

                      <Text style={styles.recipeDesc}>{recipe.description}</Text>

                      {/* Meta badges: Time & Difficulty */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={COLORS.orangeDark} />
                          <Text style={styles.metaText}>{toPersianDigits(recipe.prepTime)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="speedometer-outline" size={14} color={COLORS.grayDark} />
                          <Text style={styles.metaText}>{recipe.difficulty}</Text>
                        </View>
                      </View>

                      {/* Matched Ingredients in Fridge */}
                      <View style={styles.ingredientsSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                          <Text style={styles.sectionTitle}>مواد موجود در یخچال شما:</Text>
                        </View>
                        <View style={styles.tagsContainer}>
                          {recipe.matchedIngredients.map((item, i) => (
                            <View key={i} style={styles.matchedTag}>
                              <Text style={styles.matchedTagText}>✓ {item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Missing Ingredients */}
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

                      {/* Expandable Step-by-Step Instructions */}
                      {isExpanded ? (
                        <View style={styles.instructionsBox}>
                          <View style={styles.instructionsHeader}>
                            <MaterialCommunityIcons name="pot-steam" size={16} color={COLORS.orangeDark} />
                            <Text style={styles.instructionsTitle}>دستور پخت گام‌به‌گام:</Text>
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
                          <Text style={styles.expandButtonText}>مشاهده مراحل پخت 👇</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </RetroWindow>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  authGateCard: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 18,
    alignItems: 'center',
    marginVertical: 10,
    ...RETRO_SHADOW.md,
  },
  authGateIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgLight,
    borderWidth: BORDER.regular,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...RETRO_SHADOW.sm,
  },
  authGateTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  authGateDesc: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  authBenefitsBox: {
    width: '100%',
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'right',
  },
  authenticatedContent: {},
  dbRibbonCard: {
    backgroundColor: COLORS.cream,
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 12,
    marginBottom: 12,
    ...RETRO_SHADOW.sm,
  },
  dbRibbonHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    paddingBottom: 8,
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  userAvatarEmoji: {
    fontSize: 22,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.black,
    textAlign: 'right',
  },
  userFridgeText: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  syncBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...RETRO_SHADOW.sm,
  },
  syncBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
  },
  dbStatusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF5EA',
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  dbStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'right',
  },
  inventorySummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventorySummaryLabel: {
    fontSize: 11,
    color: COLORS.grayDark,
    textAlign: 'right',
  },
  inventorySummaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
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
    marginBottom: 14,
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
    marginBottom: 12,
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
});
