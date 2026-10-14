import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Recipe } from '../types';
import { RetroWindow } from '../components/common/RetroWindow';
import { RetroButton } from '../components/common/RetroButton';
import { RetroBadge } from '../components/common/RetroBadge';
import { RetroCookingIcon } from '../components/icons/RetroIcons';
import { toPersianDigits } from '../utils/persian';
import { COLORS, BORDER, RETRO_SHADOW } from '../constants/theme';

interface RecipesScreenProps {
  recipes: Recipe[];
  onViewInstructions: (recipe: Recipe) => void;
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({
  recipes,
  onViewInstructions,
}) => {
  // Retro Cooking Timer state (in seconds)
  const [timerSeconds, setTimerSeconds] = useState(15 * 60); // 15 mins
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${toPersianDigits(pad(mins))}:${toPersianDigits(pad(secs))}`;
  };

  const handleSetMinutes = (mins: number) => {
    setIsRunning(false);
    setTimerSeconds(mins * 60);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Retro Cooking Timer Window */}
      <RetroWindow
        title="تایمر رترو پخت و پز"
        subtitle="ابزار دستیار سرآشپز"
        headerColor={COLORS.yellow}
      >
        <View style={styles.timerBody}>
          {/* Retro 7-segment style digital clock display */}
          <View style={styles.timerDisplay}>
            <Text style={styles.timerDigits}>{formatTimer(timerSeconds)}</Text>
            {timerSeconds === 0 && (
              <Text style={styles.timerDoneText}>غذا حاضر است! 🔔</Text>
            )}
          </View>

          {/* Quick preset buttons */}
          <View style={styles.presetsRow}>
            <RetroButton
              label="۵ دقیقه"
              variant="secondary"
              size="sm"
              onPress={() => handleSetMinutes(5)}
            />
            <RetroButton
              label="۱۵ دقیقه"
              variant="secondary"
              size="sm"
              onPress={() => handleSetMinutes(15)}
            />
            <RetroButton
              label="۳۰ دقیقه"
              variant="secondary"
              size="sm"
              onPress={() => handleSetMinutes(30)}
            />
          </View>

          {/* Timer Actions */}
          <View style={styles.timerActionsRow}>
            <RetroButton
              label={isRunning ? 'توقف تایمر' : 'شروع زمان‌سنج'}
              variant={isRunning ? 'danger' : 'green'}
              onPress={() => setIsRunning(!isRunning)}
              size="md"
              style={{ flex: 1.2 }}
            />
            <RetroButton
              label="تنظیم مجدد"
              variant="secondary"
              onPress={() => {
                setIsRunning(false);
                setTimerSeconds(15 * 60);
              }}
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </RetroWindow>

      {/* Saved / Bookmarked Recipes Window */}
      <RetroWindow title="دفترچه دستورهای برگزیده" subtitle="آرشیو خانگی">
        <View style={styles.savedList}>
          {recipes.map((recipe) => (
            <View key={recipe.id} style={styles.recipeRow}>
              <RetroButton
                label="مطالعه دستور"
                variant="primary"
                size="sm"
                onPress={() => onViewInstructions(recipe)}
              />
              <View style={styles.recipeRowInfo}>
                <Text style={styles.recipeRowTitle}>{recipe.title}</Text>
                <Text style={styles.recipeRowMeta}>
                  زمان: {recipe.prepTime} • سختی: {recipe.difficulty}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </RetroWindow>

      {/* Retro Kitchen Tips Window */}
      <RetroWindow
        title="ترفندهای طلایی یخچال"
        subtitle="راهنمای نگهداری مواد غذایی"
        headerColor={COLORS.lavender}
      >
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>
            🍅 گوجه‌فرنگی‌ها را در دمای خنک نگه دارید و کنار موز قرار ندهید تا زود له نشوند.
          </Text>
          <Text style={styles.tipItem}>
            🥔 سیب‌زمینی و پیاز نباید در یک محفظه مشترک باشند، گاز پیاز باعث جوانه زدن سیب‌زمینی می‌شود!
          </Text>
          <Text style={styles.tipItem}>
            🧀 پنیر را در ظرف دربسته همراه با مقداری آب نمک ملایم نگهداری کنید تا همیشه نرم بماند.
          </Text>
        </View>
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
    paddingBottom: 24,
  },
  timerBody: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  timerDisplay: {
    width: '100%',
    backgroundColor: '#1E231C',
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerDigits: {
    fontSize: 40,
    fontWeight: '900',
    color: '#6DF870',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  timerDoneText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6E6E',
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  timerActionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    width: '100%',
  },
  savedList: {
    gap: 10,
  },
  recipeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.creamInput,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusSm,
    padding: 10,
  },
  recipeRowInfo: {
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 8,
  },
  recipeRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
  },
  recipeRowMeta: {
    fontSize: 11,
    color: COLORS.grayDark,
    marginTop: 2,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 12,
    color: COLORS.black,
    lineHeight: 18,
    textAlign: 'right',
  },
});
