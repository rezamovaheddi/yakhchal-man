import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

interface AvatarProps {
  size?: number;
}

export const ChefAvatar: React.FC<AvatarProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Chef Face */}
    <Circle cx="18" cy="22" r="11" fill="#FFE0BD" stroke={COLORS.black} strokeWidth="2" />
    {/* Eyes */}
    <Circle cx="14" cy="21" r="1.5" fill={COLORS.black} />
    <Circle cx="22" cy="21" r="1.5" fill={COLORS.black} />
    {/* Mustache */}
    <Path
      d="M14 26C16 27 18 25 18 25C18 25 20 27 22 26C24 25 24 23 23 23C21 23 18 24 18 24C18 24 15 23 13 23C12 23 12 25 14 26Z"
      fill="#423C38"
    />
    {/* Chef Hat Base */}
    <Rect x="10" y="11" width="16" height="5" rx="1" fill="#FFFFFF" stroke={COLORS.black} strokeWidth="2" />
    {/* Chef Hat Puffs */}
    <Circle cx="11" cy="9" r="4" fill="#FFFFFF" stroke={COLORS.black} strokeWidth="1.5" />
    <Circle cx="18" cy="6" r="5" fill="#FFFFFF" stroke={COLORS.black} strokeWidth="1.5" />
    <Circle cx="25" cy="9" r="4" fill="#FFFFFF" stroke={COLORS.black} strokeWidth="1.5" />
    <Rect x="11" y="9" width="14" height="6" fill="#FFFFFF" />
  </Svg>
);

export const CatAvatar: React.FC<AvatarProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Ears */}
    <Path d="M9 16L6 8L14 11L9 16Z" fill="#F49E4C" stroke={COLORS.black} strokeWidth="2" strokeLinejoin="round" />
    <Path d="M27 16L30 8L22 11L27 16Z" fill="#F49E4C" stroke={COLORS.black} strokeWidth="2" strokeLinejoin="round" />
    {/* Cat Face */}
    <Circle cx="18" cy="20" r="12" fill="#F49E4C" stroke={COLORS.black} strokeWidth="2" />
    {/* Inner face patch */}
    <Ellipse cx="18" cy="22" rx="8" ry="7" fill="#FFF2E0" />
    {/* Eyes */}
    <Circle cx="13" cy="18" r="2" fill={COLORS.black} />
    <Circle cx="23" cy="18" r="2" fill={COLORS.black} />
    <Circle cx="13.5" cy="17.5" r="0.6" fill="#FFF" />
    <Circle cx="23.5" cy="17.5" r="0.6" fill="#FFF" />
    {/* Nose and mouth */}
    <Path d="M17 21L19 21L18 22.5L17 21Z" fill="#E8483B" />
    <Path d="M16 23C17 24 18 23.5 18 23.5C18 23.5 19 24 20 23" stroke={COLORS.black} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const FridgeAvatar: React.FC<AvatarProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Fridge Body */}
    <Rect x="8" y="5" width="20" height="26" rx="4" fill="#69C2ED" stroke={COLORS.black} strokeWidth="2" />
    {/* Door Split */}
    <Path d="M8 15H28" stroke={COLORS.black} strokeWidth="2" />
    {/* Handles */}
    <Rect x="10" y="8" width="2" height="4" rx="1" fill="#FFF" stroke={COLORS.black} strokeWidth="1" />
    <Rect x="10" y="17" width="2" height="6" rx="1" fill="#FFF" stroke={COLORS.black} strokeWidth="1" />
    {/* Cute Face on Fridge */}
    <Circle cx="16" cy="22" r="1.5" fill={COLORS.black} />
    <Circle cx="22" cy="22" r="1.5" fill={COLORS.black} />
    <Path d="M17.5 25C18.5 26 19.5 26 20.5 25" stroke={COLORS.black} strokeWidth="1.5" strokeLinecap="round" />
    {/* Blush */}
    <Circle cx="14" cy="23.5" r="1.2" fill="#FFA59E" />
    <Circle cx="24" cy="23.5" r="1.2" fill="#FFA59E" />
  </Svg>
);

export const StarAvatar: React.FC<AvatarProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Retro Star */}
    <Path
      d="M18 4L21.5 13H31L23.5 19L26.5 29L18 23.5L9.5 29L12.5 19L5 13H14.5L18 4Z"
      fill={COLORS.yellow}
      stroke={COLORS.black}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Star Eyes */}
    <Circle cx="15" cy="17" r="1.5" fill={COLORS.black} />
    <Circle cx="21" cy="17" r="1.5" fill={COLORS.black} />
    <Path d="M16 20C17 21 19 21 20 20" stroke={COLORS.black} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const RobotAvatar: React.FC<AvatarProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Antenna */}
    <Path d="M18 4V8" stroke={COLORS.black} strokeWidth="2" />
    <Circle cx="18" cy="3" r="2" fill={COLORS.orange} stroke={COLORS.black} strokeWidth="1.5" />
    {/* Head */}
    <Rect x="9" y="8" width="18" height="18" rx="3" fill="#B3B9C1" stroke={COLORS.black} strokeWidth="2" />
    {/* Screen */}
    <Rect x="12" y="11" width="12" height="10" rx="1.5" fill="#1E231C" stroke={COLORS.black} strokeWidth="1.5" />
    {/* Eyes */}
    <Rect x="14" y="14" width="2" height="4" fill="#6DF870" />
    <Rect x="20" y="14" width="2" height="4" fill="#6DF870" />
    {/* Ears */}
    <Rect x="6" y="14" width="3" height="6" rx="1" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="1.5" />
    <Rect x="27" y="14" width="3" height="6" rx="1" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="1.5" />
    {/* Neck */}
    <Rect x="14" y="26" width="8" height="4" fill="#7D8691" stroke={COLORS.black} strokeWidth="1.5" />
  </Svg>
);

export const AVATAR_OPTIONS = [
  { id: 'chef', label: 'سرآشپز 👨‍🍳', component: ChefAvatar },
  { id: 'cat', label: 'پیشی آشپز 🐱', component: CatAvatar },
  { id: 'fridge', label: 'یخچال شاد 🧊', component: FridgeAvatar },
  { id: 'star', label: 'ستاره طلایی ⭐', component: StarAvatar },
  { id: 'robot', label: 'ربات رترو 🤖', component: RobotAvatar },
];

export const AvatarRenderer: React.FC<{ avatarId?: string; size?: number }> = ({
  avatarId = 'chef',
  size = 36,
}) => {
  switch (avatarId) {
    case 'cat':
      return <CatAvatar size={size} />;
    case 'fridge':
      return <FridgeAvatar size={size} />;
    case 'star':
      return <StarAvatar size={size} />;
    case 'robot':
      return <RobotAvatar size={size} />;
    case 'chef':
    default:
      return <ChefAvatar size={size} />;
  }
};
