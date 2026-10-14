export const COLORS = {
  // Background & Panels
  bg: '#D9A78F',          // Warm peach / terracotta background
  bgLight: '#F6D5B8',     // Soft peach secondary background
  cream: '#FFF9F0',       // Pale cream content panels / window bodies
  creamInput: '#FFFDF9',  // Input inner color
  
  // Retro Accents
  orange: '#FF850B',      // Bright retro title bar / primary buttons
  orangeDark: '#E06F00',  // Dark orange active border
  yellow: '#FFC52E',      // Golden retro folder / star yellow
  lavender: '#B9A2D9',    // Muted retro purple (progress bar / tags)
  green: '#8DAA72',       // Fresh retro green for available/success
  red: '#E85D54',         // Close button & alert red
  
  // Borders & Text
  black: '#171412',       // Deep vintage black / outline color
  grayDark: '#4A423D',    // Muted text
  grayLight: '#D4C8BC',   // Retro dividers / disabled elements
  white: '#FFFFFF',
};

export const RETRO_SHADOW = {
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
};

export const BORDER = {
  thin: 1.5,
  regular: 2,
  thick: 2.5,
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
};

export const FONTS = {
  regular: 'Vazirmatn_400Regular',
  medium: 'Vazirmatn_500Medium',
  bold: 'Vazirmatn_700Bold',
  black: 'Vazirmatn_900Black',
};
