import React from 'react';
import Svg, { Path, Rect, Circle, Line, G } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

export const FridgeLogoIcon: React.FC<IconProps> = ({ size = 32, color = COLORS.orange }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Fridge outer body */}
    <Rect
      x="6"
      y="3"
      width="20"
      height="26"
      rx="3"
      fill={COLORS.cream}
      stroke={COLORS.black}
      strokeWidth="2.5"
    />
    {/* Freezer division line */}
    <Line x1="6" y1="12" x2="26" y2="12" stroke={COLORS.black} strokeWidth="2.5" />
    {/* Top freezer door handle */}
    <Rect x="21" y="6" width="2" height="4" rx="1" fill={color} stroke={COLORS.black} strokeWidth="1.5" />
    {/* Main fridge door handle */}
    <Rect x="21" y="15" width="2" height="7" rx="1" fill={color} stroke={COLORS.black} strokeWidth="1.5" />
    {/* Cute retro magnets / stickers */}
    <Circle cx="12" cy="7.5" r="2" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="1" />
    <Rect x="10" y="16" width="4" height="4" rx="0.5" fill={COLORS.lavender} stroke={COLORS.black} strokeWidth="1" />
  </Svg>
);

export const RetroHomeIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Roof */}
    <Path
      d="M3 11L12 3L21 11"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={COLORS.orange}
    />
    {/* House walls */}
    <Path
      d="M5 10V20H19V10"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={COLORS.cream}
    />
    {/* Door */}
    <Rect x="10" y="13" width="4" height="7" fill={color} />
  </Svg>
);

export const RetroCookingIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cooking Pot Lid */}
    <Path d="M7 8C7 5 17 5 17 8H7Z" fill={COLORS.yellow} stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Line x1="12" y1="5" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Pot handles */}
    <Path d="M3 12H5M19 12H21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    {/* Pot Body */}
    <Path
      d="M5 9H19V16C19 19 16 21 12 21C8 21 5 19 5 16V9Z"
      fill={COLORS.cream}
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Steam lines */}
    <Path d="M10 2C9 1 11 0 10 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M14 2C13 1 15 0 14 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const RetroBookIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Book Cover */}
    <Path
      d="M4 4H18C19.5 4 21 5 21 7V20C21 18.5 19.5 18 18 18H4V4Z"
      fill={COLORS.lavender}
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Book Spine */}
    <Rect x="4" y="4" width="3" height="16" fill={COLORS.yellow} stroke={color} strokeWidth="2" />
    {/* Bookmark ribbon */}
    <Path d="M13 4V11L15 9.5L17 11V4" fill={COLORS.orange} stroke={color} strokeWidth="1.5" />
  </Svg>
);

export const RetroCloseIcon: React.FC<IconProps> = ({ size = 12, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Line x1="2" y1="2" x2="10" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="10" y1="2" x2="2" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const RetroMinimizeIcon: React.FC<IconProps> = ({ size = 12, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Line x1="2" y1="9" x2="10" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const RetroMaximizeIcon: React.FC<IconProps> = ({ size = 12, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Rect x="2" y="2" width="8" height="8" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
);

export const RetroClockIcon: React.FC<IconProps> = ({ size = 16, color = COLORS.black }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Circle cx="8" cy="8" r="6.5" fill={COLORS.cream} stroke={color} strokeWidth="2" />
    <Path d="M8 4.5V8L11 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
