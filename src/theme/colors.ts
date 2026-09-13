// =====================================================================
// SISTEMA DE COLOR - JOEKAT FINANCE FINTECH PREMIUM
// Paleta: Verde Profundo, Verde Financiero, Azul Oscuro, Blanco Marfil
// =====================================================================

export const BrandColors = {
  // Paleta oficial JOEKAT FINANCE Fintech
  nightBlue: '#071827',     // Azul oscuro principal
  deepBlue: '#0F766E',      // Verde profundo principal (acciones, primario)
  mediumBlue: '#102A43',    // Azul secundario (tarjetas, fondos alternos)
  petrolBlue: '#14B8A6',    // Verde financiero secundario (acentos, highlights)
  slateBlue: 'rgba(248, 245, 236, 0.75)', // Blanco translúcido para textos secundarios
  skyBlue: '#14B8A6',       // Verde financiero (positivos, crecimiento)
  lightSky: 'rgba(255, 255, 255, 0.08)',  // Glass translúcido

  // Colores complementarios
  warmWhite: '#F8F5EC',     // Blanco marfil
  pureWhite: '#FFFFFF',
  charcoal: '#071827',
  softGrey: '#102A43',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderDark: 'rgba(255, 255, 255, 0.12)',

  // Estados semánticos
  success: '#14B8A6',
  successLight: 'rgba(20, 184, 166, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#60A5FA',
};

// Identidad visual para KATH (verde esmeralda suave + marfil, sin rosa chillón)
export const KathColors = {
  dark: '#071827',
  primary: '#0F766E',
  medium: '#14B8A6',
  soft: 'rgba(20, 184, 166, 0.3)',
  light: 'rgba(20, 184, 166, 0.15)',
  pale: 'rgba(248, 245, 236, 0.12)',
  background: '#071827',
  surfaceCard: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(20, 184, 166, 0.25)',
};

// Identidad visual para JOEL (verde financiero + azul oscuro)
export const JoelColors = {
  dark: '#071827',
  primary: '#14B8A6',
  medium: '#0F766E',
  petrol: '#102A43',
  slate: 'rgba(248, 245, 236, 0.75)',
  light: '#14B8A6',
  pale: 'rgba(255, 255, 255, 0.08)',
  background: '#071827',
  surfaceCard: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
};

export interface ThemeColors {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceCard: string;
  surfaceCardAlt: string;
  headerBackground: string;
  headerText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  highlight: string;
  border: string;
  borderFocus: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardShadow: string;
  statusGreen: string;
  statusRed: string;
}

export const DarkTheme: ThemeColors = {
  mode: 'dark',
  background: '#071827',           // Azul oscuro principal
  surface: '#102A43',              // Azul secundario
  surfaceCard: 'rgba(255, 255, 255, 0.08)', // Glassmorphism
  surfaceCardAlt: 'rgba(255, 255, 255, 0.04)',
  headerBackground: '#071827',
  headerText: '#F8F5EC',           // Blanco marfil
  textPrimary: '#F8F5EC',          // Blanco marfil
  textSecondary: 'rgba(248, 245, 236, 0.75)', // Blanco translúcido
  textMuted: 'rgba(248, 245, 236, 0.50)',
  textInverse: '#071827',
  accent: '#14B8A6',               // Verde financiero
  accentLight: '#0F766E',          // Verde profundo
  highlight: '#14B8A6',
  border: 'rgba(255, 255, 255, 0.12)',
  borderFocus: '#14B8A6',
  tabBarBackground: 'rgba(7, 24, 39, 0.88)',
  tabBarActive: '#14B8A6',
  tabBarInactive: 'rgba(248, 245, 236, 0.50)',
  cardShadow: 'rgba(0, 0, 0, 0.28)',
  statusGreen: '#14B8A6',
  statusRed: '#F87171',
};

export const LightTheme: ThemeColors = {
  mode: 'light',
  background: '#F8F5EC',           // Blanco marfil
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceCardAlt: 'rgba(15, 118, 110, 0.06)',
  headerBackground: '#071827',
  headerText: '#F8F5EC',
  textPrimary: '#071827',          // Azul oscuro
  textSecondary: '#102A43',
  textMuted: '#64748B',
  textInverse: '#F8F5EC',
  accent: '#0F766E',               // Verde profundo
  accentLight: '#14B8A6',
  highlight: '#14B8A6',
  border: 'rgba(7, 24, 39, 0.12)',
  borderFocus: '#0F766E',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#0F766E',
  tabBarInactive: '#94A3B8',
  cardShadow: 'rgba(7, 24, 39, 0.08)',
  statusGreen: '#0F766E',
  statusRed: '#EF4444',
};
