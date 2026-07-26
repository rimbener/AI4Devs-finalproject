/**
 * AI Study Buddy — color system (Material Design 3 tonal model).
 * Palette "Study Buddy" (adopted from the brand logo), ported from the design system's tokens/colors.css.
 * oklch ramp values are pre-converted to sRGB hex (React Native has no oklch support).
 */

export const palette = {
  brand: {
    royal: '#002C5D',
    cyan: '#0090D8',
    orange: '#F09030',
    red: '#F06018',
    gold: '#F0D860',
    offWhite: '#F2EFE9',
    white: '#FFFFFF',
  },
  /** Royal Blue ramp (hue ~255) */
  primary: {
    0: '#000000',
    10: '#001535',
    20: '#00214C',
    30: '#002D5E',
    40: '#124784',
    50: '#2964AA',
    60: '#4682CC',
    70: '#6FA1E1',
    80: '#A1C4F1',
    90: '#CDE0F9',
    95: '#E7F1FE',
    99: '#F9FCFF',
    100: '#ffffff',
  },
  /** Azure Cyan ramp (hue ~240) */
  secondary: {
    0: '#000000',
    10: '#002236',
    20: '#003756',
    30: '#00537E',
    40: '#0070AA',
    50: '#0091D7',
    60: '#44A8E7',
    70: '#79C0F1',
    80: '#ABD7F8',
    90: '#D2EAFC',
    95: '#E7F4FD',
    99: '#F8FCFF',
    100: '#ffffff',
  },
  /**
   * Orange ramp (hue ~60).
   * The design system's previous ramp (hue 52, seed L 0.58) was carried over
   * from the old "Rust" ramp's lightness curve and never re-derived for the
   * Orange seed — it rendered as a dark burnt brown (~#BD5A00) instead of the
   * intended #F09030. Re-anchored so tertiary[45] hits the true seed color.
   */
  tertiary: {
    0: '#000000',
    10: '#2C1300',
    20: '#5E3306',
    30: '#965719',
    40: '#D17C28',
    45: '#F09031',
    50: '#FA9633',
    60: '#FFA74F',
    70: '#FFBB78',
    80: '#FFD1A4',
    90: '#FFE7CD',
    95: '#FFF2E5',
    99: '#FFFBF6',
    100: '#ffffff',
  },
  /** Warm neutral ramp (hue ~85, very low chroma) */
  neutral: {
    0: '#000000',
    10: '#1c1a17',
    20: '#302e29',
    30: '#4a4743',
    40: '#65635e',
    50: '#82807b',
    60: '#a19e99',
    70: '#bdbab5',
    80: '#d7d4ce',
    90: '#eae7e2',
    94: '#f3f0ea',
    96: '#f7f4ef',
    98: '#fbf9f5',
    99: '#fdfcf9',
    100: '#ffffff',
  },
  /** Neutral-variant ramp for outlines / muted borders */
  neutralVariant: {
    30: '#414950',
    50: '#6a737b',
    60: '#858d96',
    70: '#a1a9b0',
    80: '#bec5cc',
    90: '#dbe0e6',
  },
  /** MD3 default error red */
  error: {
    10: '#430002',
    20: '#650000',
    40: '#b7191c',
    80: '#fdb1a8',
    90: '#ffd5d0',
  },
} as const;

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  primary: palette.primary[30],
  onPrimary: palette.primary[100],
  primaryContainer: palette.primary[90],
  onPrimaryContainer: palette.primary[10],
  secondary: palette.secondary[30],
  onSecondary: palette.secondary[100],
  secondaryContainer: palette.secondary[90],
  onSecondaryContainer: palette.secondary[10],
  tertiary: palette.tertiary[45],
  onTertiary: palette.tertiary[100],
  tertiaryContainer: palette.tertiary[90],
  onTertiaryContainer: palette.tertiary[10],
  error: palette.error[40],
  onError: '#ffffff',
  errorContainer: palette.error[90],
  onErrorContainer: palette.error[10],
  background: palette.neutral[96],
  onBackground: palette.neutral[10],
  surface: palette.neutral[98],
  onSurface: palette.neutral[10],
  surfaceVariant: palette.neutralVariant[90],
  onSurfaceVariant: palette.neutralVariant[30],
  surfaceContainerLowest: palette.neutral[100],
  surfaceContainerLow: palette.neutral[96],
  surfaceContainer: palette.neutral[94],
  surfaceContainerHigh: palette.neutral[90],
  surfaceContainerHighest: palette.neutral[80],
  outline: palette.neutralVariant[50],
  outlineVariant: palette.neutralVariant[80],
  inverseSurface: palette.secondary[20],
  inverseOnSurface: palette.neutral[96],
  inversePrimary: palette.primary[80],
  scrim: '#000000',
  shadow: '#000000',
};

export const darkColors: ThemeColors = {
  primary: palette.primary[80],
  onPrimary: palette.primary[20],
  primaryContainer: palette.primary[30],
  onPrimaryContainer: palette.primary[90],
  secondary: palette.secondary[80],
  onSecondary: palette.secondary[20],
  secondaryContainer: palette.secondary[30],
  onSecondaryContainer: palette.secondary[90],
  tertiary: palette.tertiary[80],
  onTertiary: palette.tertiary[20],
  tertiaryContainer: palette.tertiary[30],
  onTertiaryContainer: palette.tertiary[90],
  error: palette.error[80],
  onError: palette.error[20],
  errorContainer: palette.error[20],
  onErrorContainer: palette.error[90],
  background: palette.secondary[10],
  onBackground: palette.neutral[90],
  surface: palette.secondary[10],
  onSurface: palette.neutral[90],
  surfaceVariant: palette.neutralVariant[30],
  onSurfaceVariant: palette.neutralVariant[80],
  surfaceContainerLowest: palette.secondary[0],
  surfaceContainerLow: palette.secondary[10],
  surfaceContainer: '#15202d',
  surfaceContainerHigh: '#202c3b',
  surfaceContainerHighest: '#2c3948',
  outline: palette.neutralVariant[60],
  outlineVariant: palette.neutralVariant[30],
  inverseSurface: palette.neutral[90],
  inverseOnSurface: palette.secondary[20],
  inversePrimary: palette.primary[30],
  scrim: '#000000',
  shadow: '#000000',
};

/** MD3 state-layer opacities: a translucent wash of the content color. */
export const stateLayerOpacity = {
  hover: 0.08,
  focus: 0.12,
  press: 0.12,
  drag: 0.16,
} as const;

/** MD3 disabled-content/container opacity. */
export const disabledOpacity = 0.38;

/** '#rrggbb' + alpha → 'rgba(r, g, b, a)'. */
export const hexWithOpacity = (hex: string, alpha: number): string => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** Mix two '#rrggbb' colors: ratio = weight of `a` (0–1). */
export const mixHex = (a: string, b: string, ratio: number): string => {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * ratio + ((pb >> shift) & 255) * (1 - ratio));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
};
