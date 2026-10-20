import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export interface IconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Base App Navigation & Toolbar Icons (Expo Vector Icons: Ionicons / MDI)
// ---------------------------------------------------------------------------

export const FridgeLogoIcon: React.FC<IconProps> = ({
  size = 28,
  color = COLORS.black,
}) => (
  <MaterialCommunityIcons
    name="fridge"
    size={size}
    color={color}
  />
);

export const RetroHomeIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 20,
  color = COLORS.black,
  active = false,
}) => (
  <Ionicons
    name={active ? 'home' : 'home-outline'}
    size={size}
    color={color}
  />
);

export const RetroCookingIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 22,
  color = COLORS.black,
  active = false,
}) => (
  <MaterialCommunityIcons
    name={active ? 'pot-steam' : 'pot-steam-outline'}
    size={size}
    color={color}
  />
);

export const RetroBookIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 20,
  color = COLORS.black,
  active = false,
}) => (
  <Ionicons
    name={active ? 'book' : 'book-outline'}
    size={size}
    color={color}
  />
);

// ---------------------------------------------------------------------------
// Window Control & System Icons
// ---------------------------------------------------------------------------

export const RetroMinimizeIcon: React.FC<IconProps> = ({
  size = 12,
  color = COLORS.black,
}) => (
  <Ionicons name="remove" size={size} color={color} />
);

export const RetroMaximizeIcon: React.FC<IconProps> = ({
  size = 11,
  color = COLORS.black,
}) => (
  <MaterialCommunityIcons name="window-maximize" size={size} color={color} />
);

export const RetroCloseIcon: React.FC<IconProps> = ({
  size = 12,
  color = COLORS.black,
}) => (
  <Ionicons name="close" size={size} color={color} />
);

// ---------------------------------------------------------------------------
// Utility & Semantic Action Icons
// ---------------------------------------------------------------------------

export const RetroClockIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="time-outline" size={size} color={color} />
);

export const RetroTimerIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="timer-outline" size={size} color={color} />
);

export const RetroSearchIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="search" size={size} color={color} />
);

export const RetroAddIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="add" size={size} color={color} />
);

export const RetroRemoveIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="remove" size={size} color={color} />
);

export const RetroEditIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <MaterialCommunityIcons name="pencil-outline" size={size} color={color} />
);

export const RetroRefreshIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="refresh" size={size} color={color} />
);

export const RetroCheckIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="checkmark" size={size} color={color} />
);

export const RetroCheckCircleIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="checkmark-circle" size={size} color={color} />
);

export const RetroAlertIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#D9381E',
}) => (
  <MaterialCommunityIcons name="alert-circle-outline" size={size} color={color} />
);

export const RetroWarningIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.orange,
}) => (
  <Ionicons name="warning-outline" size={size} color={color} />
);

export const RetroAlarmLightIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#D9381E',
}) => (
  <MaterialCommunityIcons name="alarm-light" size={size} color={color} />
);

export const RetroTrashIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <MaterialCommunityIcons name="trash-can-outline" size={size} color={color} />
);

export const RetroSparkleIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.yellow,
}) => (
  <Ionicons name="sparkles" size={size} color={color} />
);

export const RetroBulbIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.orange,
}) => (
  <Ionicons name="bulb-outline" size={size} color={color} />
);

export const RetroUserIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="person-circle-outline" size={size} color={color} />
);

export const RetroLogoutIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="log-out-outline" size={size} color={color} />
);

export const RetroKeyIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="key-outline" size={size} color={color} />
);

export const RetroLockIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="lock-closed-outline" size={size} color={color} />
);

export const RetroSnowflakeIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#0288D1',
}) => (
  <MaterialCommunityIcons name="snowflake" size={size} color={color} />
);

export const RetroCupboardIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#6D4C41',
}) => (
  <MaterialCommunityIcons name="cupboard-outline" size={size} color={color} />
);

export const RetroSavingsIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.green,
}) => (
  <MaterialCommunityIcons name="piggy-bank-outline" size={size} color={color} />
);

export const RetroCashCheckIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.green,
}) => (
  <MaterialCommunityIcons name="cash-check" size={size} color={color} />
);

export const RetroLeafIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.green,
}) => (
  <MaterialCommunityIcons name="leaf" size={size} color={color} />
);

export const RetroPlayIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="play" size={size} color={color} />
);

export const RetroPauseIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="pause" size={size} color={color} />
);

export const RetroBellIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.orange,
}) => (
  <Ionicons name="notifications" size={size} color={color} />
);

export const RetroDownloadIcon: React.FC<IconProps> = ({
  size = 18,
  color = COLORS.black,
}) => (
  <Ionicons name="cloud-download-outline" size={size} color={color} />
);

export const RetroSpeedometerIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="speedometer-outline" size={size} color={color} />
);

export const RetroPeopleIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="people-outline" size={size} color={color} />
);

export const RetroSwapIcon: React.FC<IconProps> = ({
  size = 16,
  color = COLORS.black,
}) => (
  <Ionicons name="swap-horizontal" size={size} color={color} />
);
