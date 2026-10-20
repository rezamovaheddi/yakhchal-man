import React from 'react';
import Svg, { Path, Rect, Circle, G, Ellipse } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

export const GarlicIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 6C13 11 9 17 9 23C9 28 13 31 18 31C23 31 27 28 27 23C27 17 23 11 18 6Z"
      fill="#FBF8EE"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M18 6V31M18 6C14 13 13 23 15 29M18 6C22 13 23 23 21 29"
      stroke="#DDD3B8"
      strokeWidth="1.5"
    />
    <Path d="M18 6V3" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const CarrotIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M24 10L14 30C13 32 11 31 11 29L12 12C12 10 14 9 16 9L24 10Z"
      fill="#FF7A29"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path d="M14 16L19 17M13 22L17 23" stroke="#D9570B" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M21 9L27 4M20 7L24 2M18 8L20 3" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const MushroomIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M14 20V28C14 30 16 31 18 31C20 31 22 30 22 28V20H14Z"
      fill="#F4EDE2"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M6 20C6 11 11 6 18 6C25 6 30 11 30 20H6Z"
      fill="#B85D3B"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="14" r="2" fill="#FFFDF8" />
    <Circle cx="23" cy="13" r="2.2" fill="#FFFDF8" />
    <Circle cx="18" cy="10" r="1.5" fill="#FFFDF8" />
  </Svg>
);

export const ChickenIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M24 12C20 8 13 10 11 15C9 20 12 25 17 26C22 27 28 22 28 17C28 15 26 13 24 12Z"
      fill="#DE8B35"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M11 23L5 29M6 31C5 32 3 32 3 30C3 28 4 28 5 29M7 27C7 26 5 25 4 26"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Circle cx="19" cy="17" r="3" fill="#BF6F1F" />
  </Svg>
);

export const ButterIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path d="M5 25H31V28H5V25Z" fill="#DDD" stroke={COLORS.black} strokeWidth="2" />
    <Path d="M8 25L12 16H28L25 25H8Z" fill="#FFE066" stroke={COLORS.black} strokeWidth="2.5" strokeLinejoin="round" />
    <Path d="M12 16L18 12H30L28 16H12Z" fill="#FFF3A8" stroke={COLORS.black} strokeWidth="2" strokeLinejoin="round" />
  </Svg>
);

export const BreadIcon: React.FC<IconProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M8 17C8 10 13 8 18 8C23 8 28 10 28 17V26C28 28 26 30 24 30H12C10 30 8 28 8 26V17Z"
      fill="#FCEFD2"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M7 16C7 9 12 7 18 7C24 7 29 9 29 16C29 18 27 20 25 20H11C9 20 7 18 7 16Z"
      fill="#C67D38"
      stroke={COLORS.black}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path d="M13 13L16 11M19 13L22 11" stroke="#FCEFD2" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const FoodIconRenderer: React.FC<{ iconName: string; size?: number }> = ({
  iconName,
  size = 36,
}) => {
  switch (iconName.toLowerCase()) {
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
    case 'garlic':
      return <GarlicIcon size={size} />;
    case 'carrot':
      return <CarrotIcon size={size} />;
    case 'mushroom':
      return <MushroomIcon size={size} />;
    case 'chicken':
      return <ChickenIcon size={size} />;
    case 'butter':
      return <ButterIcon size={size} />;
    case 'bread':
      return <BreadIcon size={size} />;
    // Expo Vector Icons mappings (MaterialCommunityIcons from icons.expo.fyi)
    case 'fish':
      return <MaterialCommunityIcons name="fish" size={size} color="#0288D1" />;
    case 'meat':
    case 'steak':
      return <MaterialCommunityIcons name="food-steak" size={size} color="#C62828" />;
    case 'rice':
      return <MaterialCommunityIcons name="rice" size={size} color="#616161" />;
    case 'noodle':
    case 'noodles':
    case 'pasta':
      return <MaterialCommunityIcons name="noodles" size={size} color="#F57F17" />;
    case 'apple':
    case 'fruit':
      return <MaterialCommunityIcons name="food-apple" size={size} color="#D32F2F" />;
    case 'corn':
      return <MaterialCommunityIcons name="corn" size={size} color="#FBC02D" />;
    case 'spice':
    case 'salt':
      return <MaterialCommunityIcons name="shaker-outline" size={size} color="#5D4037" />;
    case 'drink':
    case 'beverage':
    case 'water':
      return <MaterialCommunityIcons name="cup-water" size={size} color="#0288D1" />;
    case 'herb':
    case 'vegetable':
    case 'greens':
      return <MaterialCommunityIcons name="sprout" size={size} color="#2E7D32" />;
    case 'stew':
    case 'soup':
      return <MaterialCommunityIcons name="pot-steam" size={size} color="#E65100" />;
    default:
      return <MaterialCommunityIcons name="silverware-fork-knife" size={size * 0.85} color={COLORS.black} />;
  }
};
