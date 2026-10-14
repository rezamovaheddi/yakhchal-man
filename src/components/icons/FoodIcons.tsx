import React from 'react';
import Svg, { Path, Rect, Circle, G, Ellipse } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

interface IconProps {
  size?: number;
}

export const EggIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Egg base */}
    <Ellipse cx="18" cy="19" rx="13" ry="15" fill="#FFFDF8" stroke={COLORS.black} strokeWidth="2.5" />
    {/* Yolk */}
    <Circle cx="18" cy="20" r="7.5" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="2" />
    {/* Highlight shine */}
    <Circle cx="15.5" cy="17.5" r="2" fill="#FFFFFF" />
  </Svg>
);

export const TomatoIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Tomato body */}
    <Circle cx="18" cy="20" r="13" fill="#E8483B" stroke={COLORS.black} strokeWidth="2.5" />
    {/* Highlight */}
    <Path
      d="M10 14C12 11 16 10 18 10"
      stroke="#FF8B80"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Green calyx/stem */}
    <Path
      d="M18 10V4M18 10L13 6M18 10L23 6M18 10L12 11M18 10L24 11"
      stroke={COLORS.green}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PotatoIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Potato body */}
    <Path
      d="M7 19C6 11 11 6 18 6C26 6 30 11 29 19C28 27 24 30 17 30C10 30 8 27 7 19Z"
      fill="#D9A86C"
      stroke={COLORS.black}
      strokeWidth="2.5"
    />
    {/* Potato spots */}
    <Circle cx="12" cy="14" r="1.5" fill="#8C5E28" />
    <Circle cx="23" cy="16" r="1.5" fill="#8C5E28" />
    <Circle cx="16" cy="24" r="1.5" fill="#8C5E28" />
    <Circle cx="21" cy="22" r="1.2" fill="#8C5E28" />
  </Svg>
);

export const CheeseIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Cheese wedge */}
    <Path
      d="M6 25L30 25L28 11L6 25Z"
      fill={COLORS.yellow}
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M6 25L12 9L28 11L6 25Z"
      fill="#FFE27A"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Holes */}
    <Circle cx="15" cy="20" r="2.2" fill="#E5AA15" />
    <Circle cx="23" cy="21" r="1.8" fill="#E5AA15" />
    <Circle cx="18" cy="14" r="1.5" fill="#E5AA15" />
  </Svg>
);

export const MilkIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Milk carton */}
    <Path
      d="M10 13L14 6H22L26 13V30H10V13Z"
      fill="#FFFDF8"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Blue stripe */}
    <Rect
      x="10"
      y="18"
      width="16"
      height="7"
      fill="#5BA2E6"
      stroke={COLORS.black}
      strokeWidth="2"
    />
    {/* Cute cow spot / splash */}
    <Circle cx="18" cy="14" r="2" fill="#5BA2E6" />
  </Svg>
);

export const OnionIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Onion body */}
    <Path
      d="M18 5C11 12 7 19 8 24C9 29 13 31 18 31C23 31 27 29 28 24C29 19 25 12 18 5Z"
      fill="#B87386"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Texture lines */}
    <Path
      d="M18 5V31M18 5C14 13 13 23 15 29M18 5C22 13 23 23 21 29"
      stroke="#8C4458"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Sprouts */}
    <Path
      d="M18 5L15 2M18 5L20 2"
      stroke={COLORS.green}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const OmeletteIcon: React.FC<IconProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Pan handle */}
    <Path
      d="M34 14L44 4"
      stroke={COLORS.black}
      strokeWidth="5"
      strokeLinecap="round"
    />
    <Path
      d="M34 14L44 4"
      stroke="#8C7A6B"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Frying Pan */}
    <Circle cx="21" cy="27" r="16" fill="#423C38" stroke={COLORS.black} strokeWidth="3" />
    <Circle cx="21" cy="27" r="13" fill="#E8483B" stroke={COLORS.black} strokeWidth="2" />
    {/* Eggs cooking in sauce */}
    <Circle cx="17" cy="24" r="5" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="1.5" />
    <Circle cx="16" cy="23" r="1.5" fill="#FFF" />
    <Circle cx="25" cy="28" r="5" fill={COLORS.yellow} stroke={COLORS.black} strokeWidth="1.5" />
    <Circle cx="24" cy="27" r="1.5" fill="#FFF" />
    {/* Green herb specks */}
    <Circle cx="20" cy="32" r="1" fill={COLORS.green} />
    <Circle cx="25" cy="20" r="1" fill={COLORS.green} />
    <Circle cx="13" cy="28" r="1" fill={COLORS.green} />
  </Svg>
);

export const FoodIconRenderer: React.FC<{ iconName: string; size?: number }> = ({
  iconName,
  size = 36,
}) => {
  switch (iconName) {
    case 'egg':
      return <EggIcon size={size} />;
    case 'tomato':
      return <TomatoIcon size={size} />;
    case 'potato':
      return <PotatoIcon size={size} />;
    case 'cheese':
      return <CheeseIcon size={size} />;
    case 'milk':
      return <MilkIcon size={size} />;
    case 'onion':
      return <OnionIcon size={size} />;
    case 'omelette':
      return <OmeletteIcon size={size} />;
    default:
      return <EggIcon size={size} />;
  }
};
