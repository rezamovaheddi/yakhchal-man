import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { COLORS, BORDER, RETRO_SHADOW } from '../../constants/theme';
import { toPersianDigits } from '../../utils/persian';

interface RetroTerminalLoadingProps {
  currentMessage: string;
  stepIndex: number;
  totalSteps: number;
}

export const RetroTerminalLoading: React.FC<RetroTerminalLoadingProps> = ({
  currentMessage,
  stepIndex,
  totalSteps,
}) => {
  // Use useState to instantiate Animated.Value once so React compiler / eslint rules on refs are satisfied
  const [shimmerAnim] = useState(() => new Animated.Value(0));
  const [bounceAnim] = useState(() => new Animated.Value(0));
  const [steamAnim1] = useState(() => new Animated.Value(0));
  const [steamAnim2] = useState(() => new Animated.Value(0));
  const [cursorOpacity] = useState(() => new Animated.Value(1));
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [fadeTextAnim] = useState(() => new Animated.Value(1));

  // Animated progress calculation (between 15% and 92%)
  const targetPercent = Math.min(
    95,
    Math.round(((stepIndex + 1) / Math.max(1, totalSteps)) * 100)
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetPercent,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [targetPercent, progressAnim]);

  // Message transition
  useEffect(() => {
    fadeTextAnim.setValue(0.3);
    Animated.timing(fadeTextAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentMessage, fadeTextAnim]);

  useEffect(() => {
    // Shimmer sweep
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    // Cute Mascot gentle bounce
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    bounceLoop.start();

    // Steam bubble 1
    const steamLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(steamAnim1, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(steamAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    steamLoop1.start();

    // Steam bubble 2 with delay
    const steamLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(steamAnim2, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(steamAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    steamLoop2.start();

    // Terminal blinking cursor
    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    cursorLoop.start();

    return () => {
      shimmerLoop.stop();
      bounceLoop.stop();
      steamLoop1.stop();
      steamLoop2.stop();
      cursorLoop.stop();
    };
  }, [shimmerAnim, bounceAnim, steamAnim1, steamAnim2, cursorOpacity]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 360],
  });

  const steam1TranslateY = steamAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });
  const steam1Opacity = steamAnim1.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0, 0.9, 0.6, 0],
  });

  const steam2TranslateY = steamAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });
  const steam2Opacity = steamAnim2.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0, 0.85, 0.5, 0],
  });

  return (
    <View style={styles.container}>
      {/* 1. RETRO TERMINAL HEADER */}
      <View style={styles.terminalHeader}>
        <View style={styles.headerControls}>
          <View style={[styles.headerDot, { backgroundColor: '#EF4444' }]} />
          <View style={[styles.headerDot, { backgroundColor: '#F59E0B' }]} />
          <View style={[styles.headerDot, { backgroundColor: '#10B981' }]} />
        </View>

        <View style={styles.titleBadge}>
          <Text style={styles.terminalTitle}>C:\AI_CHEF\GEMINI_LLM.EXE</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.stepCounterText}>
            گام {toPersianDigits(stepIndex + 1)} از {toPersianDigits(totalSteps)}
          </Text>
        </View>
      </View>

      {/* 2. TERMINAL BODY */}
      <View style={styles.terminalBody}>
        {/* Animated Mascot + Steam Section */}
        <View style={styles.mascotRow}>
          {/* Animated cute cartoon fridge */}
          <Animated.View
            style={[
              styles.mascotWrap,
              {
                transform: [{ translateY: bounceAnim }],
              },
            ]}
          >
            {/* Animated floating steam bubbles above fridge */}
            <Animated.View
              style={[
                styles.steamParticle,
                {
                  left: 32,
                  top: -2,
                  opacity: steam1Opacity,
                  transform: [{ translateY: steam1TranslateY }],
                },
              ]}
            >
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Circle cx="6" cy="6" r="5" fill="#38BDF8" opacity={0.8} />
              </Svg>
            </Animated.View>

            <Animated.View
              style={[
                styles.steamParticle,
                {
                  left: 48,
                  top: -6,
                  opacity: steam2Opacity,
                  transform: [{ translateY: steam2TranslateY }],
                },
              ]}
            >
              <Svg width={10} height={10} viewBox="0 0 10 10">
                <Circle cx="5" cy="5" r="4" fill="#FBBF24" opacity={0.8} />
              </Svg>
            </Animated.View>

            {/* Cute Kawaii Fridge SVG Character */}
            <Svg width={72} height={82} viewBox="0 0 72 82" fill="none">
              <Defs>
                <LinearGradient id="fridgeGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#E0F2FE" />
                </LinearGradient>
              </Defs>

              {/* Fridge shadow */}
              <Rect x="12" y="74" width="48" height="6" rx="3" fill="#0F172A" opacity={0.6} />

              {/* Fridge feet */}
              <Rect x="16" y="70" width="8" height="6" rx="2" fill="#475569" stroke="#0F172A" strokeWidth="1.5" />
              <Rect x="48" y="70" width="8" height="6" rx="2" fill="#475569" stroke="#0F172A" strokeWidth="1.5" />

              {/* Fridge body */}
              <Rect
                x="12"
                y="14"
                width="48"
                height="58"
                rx="10"
                fill="url(#fridgeGrad)"
                stroke="#0F172A"
                strokeWidth="2.5"
              />

              {/* Door divider */}
              <Path d="M13 36H59" stroke="#0F172A" strokeWidth="2" />

              {/* Handles */}
              <Rect x="16" y="20" width="3.5" height="10" rx="1.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="1" />
              <Rect x="16" y="42" width="3.5" height="18" rx="1.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="1" />

              {/* Kawaii Eyes */}
              <Circle cx="30" cy="27" r="2.8" fill="#0F172A" />
              <Circle cx="44" cy="27" r="2.8" fill="#0F172A" />
              {/* Eye sparkles */}
              <Circle cx="29" cy="26" r="1" fill="#FFFFFF" />
              <Circle cx="43" cy="26" r="1" fill="#FFFFFF" />

              {/* Cheeks */}
              <Circle cx="26" cy="30" r="2.5" fill="#FDA4AF" />
              <Circle cx="48" cy="30" r="2.5" fill="#FDA4AF" />

              {/* Cute Smile */}
              <Path
                d="M34 29Q37 33 40 29"
                stroke="#0F172A"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Mini Chef Hat on Top! */}
              <G>
                <Circle cx="32" cy="11" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                <Circle cx="42" cy="11" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                <Circle cx="37" cy="8" r="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                <Rect x="30" y="12" width="14" height="4" rx="1" fill="#F59E0B" stroke="#0F172A" strokeWidth="1" />
              </G>

              {/* Lower door cute magnets */}
              {/* Heart magnet */}
              <Circle cx="45" cy="46" r="3.5" fill="#EF4444" stroke="#0F172A" strokeWidth="1" />
              {/* Note sticker */}
              <Rect x="30" y="52" width="9" height="9" rx="1" fill="#FEF08A" stroke="#0F172A" strokeWidth="1" />
            </Svg>
          </Animated.View>

          {/* Dialog bubble next to fridge */}
          <View style={styles.dialogBubble}>
            <View style={styles.bubbleHeaderRow}>
              <Text style={styles.chefBadge}>👨‍🍳 سرآشپز هوشمند</Text>
              <View style={styles.livePulseDot} />
            </View>
            <Animated.Text style={[styles.bubbleMessageText, { opacity: fadeTextAnim }]}>
              {currentMessage}
            </Animated.Text>
          </View>
        </View>

        {/* 3. TERMINAL COMMAND & BLINKING CURSOR */}
        <View style={styles.cliPromptRow}>
          <Text style={styles.promptSign}>&gt;</Text>
          <Text style={styles.promptText}>gemini.generateMenu(inventory, style=&apos;ir&apos;)</Text>
          <Animated.View style={[styles.terminalCursor, { opacity: cursorOpacity }]} />
        </View>

        {/* 4. ANIMATED RETRO PROGRESS BAR */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressBarWidth },
              ]}
            >
              {/* Shimmer sweep effect */}
              <Animated.View
                style={[
                  styles.shimmerSweep,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              />
            </Animated.View>
          </View>

          {/* Progress Percent Label */}
          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterNote}>
              پردازش هوش مصنوعی آنلاین ⚡
            </Text>
            <Text style={styles.progressPercentText}>
              %{toPersianDigits(targetPercent)}
            </Text>
          </View>
        </View>

        {/* 5. FOOTER HINT */}
        <View style={styles.footerNoteRow}>
          <Text style={styles.terminalHintText}>
            داده‌های یخچال کاربر در دیتابیس ثبت و توسط مدل زبان Gemini تحلیل می‌شود...
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A', // Deep dark retro terminal
    borderWidth: BORDER.thick,
    borderColor: COLORS.black,
    borderRadius: BORDER.radiusMd,
    overflow: 'hidden',
    marginBottom: 14,
    ...RETRO_SHADOW.md,
  },
  terminalHeader: {
    backgroundColor: '#1E293B',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#334155',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-start',
  },
  stepCounterText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '800',
  },
  terminalBody: {
    padding: 12,
  },
  mascotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  mascotWrap: {
    width: 72,
    height: 82,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  steamParticle: {
    position: 'absolute',
  },
  dialogBubble: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 8,
    padding: 10,
    position: 'relative',
    ...RETRO_SHADOW.sm,
  },
  bubbleHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chefBadge: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '800',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  bubbleMessageText: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 19,
  },
  cliPromptRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
    gap: 6,
  },
  promptSign: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  promptText: {
    fontSize: 10,
    color: '#A5B4FC',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  terminalCursor: {
    width: 6,
    height: 12,
    backgroundColor: '#38BDF8',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 14,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#475569',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ skewX: '-25deg' }],
  },
  progressFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
  },
  progressFooterNote: {
    fontSize: 9,
    color: '#64748B',
  },
  footerNoteRow: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 6,
    marginTop: 2,
  },
  terminalHintText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    lineHeight: 16,
  },
});
