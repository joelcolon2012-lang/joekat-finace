// =====================================================================
// SISTEMA OFICIAL DE COLOR - JOEKAT FINACE
// Basado rigurosamente en la paleta oficial e identidad del logotipo
// =====================================================================

export const BrandColors = {
  // Paleta oficial JOEKAT FINACE
  nightBlue: '#001D39', // Azul noche profundo: encabezados, fondos oscuros, navegación
  deepBlue: '#0A4174',  // Azul profundo: color principal de interacción
  mediumBlue: '#49769F',// Azul medio: elementos secundarios y gráficos
  petrolBlue: '#4E8EA2',// Azul petróleo claro: categorías secundarias
  slateBlue: '#6EA2B3', // Azul grisáceo: información auxiliar y bordes
  skyBlue: '#7BBDE8',   // Azul cielo: acentos, highlights e indicadores positivos
  lightSky: '#BDD8E9',  // Azul muy claro: fondos secundarios, tarjetas y áreas suaves

  // Colores complementarios
  warmWhite: '#FBFBFD',
  pureWhite: '#FFFFFF',
  charcoal: '#0B1118',
  softGrey: '#F1F5F9',
  borderLight: '#E2E8F0',
  borderDark: '#1E293B',

  // Estados semánticos
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
};

// Paleta oficial e identidad visual para KATH (elegante, femenino, moderno y premium)
export const KathColors = {
  dark: '#4A1830',       // Kath Dark: acentos oscuros y contraste
  primary: '#8E3A62',    // Kath Primary: color principal de interacción de Kath
  medium: '#B45B7D',     // Kath Medium: series intermedias y gráficos
  soft: '#D98FA9',       // Kath Soft: bordes y chips suaves
  light: '#F0B9CB',      // Kath Light: fondos activos
  pale: '#F9DCE6',       // Kath Pale: chips y distintivos de movimiento
  background: '#FFF4F7', // Kath Background: fondo exclusivo de Kath
  surfaceCard: '#FFF0F5',
  border: '#F3D2DF',
};

// Paleta oficial para JOEL (azul corporativo JOEKAT)
export const JoelColors = {
  dark: '#001D39',       // Joel Dark: noche profundo
  primary: '#0A4174',    // Joel Primary: azul profundo
  medium: '#49769F',     // Joel Medium: azul medio
  petrol: '#4E8EA2',     // Joel Petrol: azul petróleo
  slate: '#6EA2B3',      // Joel Slate: azul grisáceo
  light: '#7BBDE8',      // Joel Light: azul cielo
  pale: '#BDD8E9',       // Joel Pale: fondo suave
  background: '#F0F6FA',
  surfaceCard: '#FFFFFF',
  border: '#D0E4F2',
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

export const LightTheme: ThemeColors = {
  mode: 'light',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceCardAlt: '#F0F6FA',
  headerBackground: BrandColors.nightBlue,
  headerText: '#FFFFFF',
  textPrimary: '#001D39',
  textSecondary: '#49769F',
  textMuted: '#6EA2B3',
  textInverse: '#FFFFFF',
  accent: BrandColors.deepBlue,
  accentLight: BrandColors.lightSky,
  highlight: BrandColors.skyBlue,
  border: '#E2E8F0',
  borderFocus: BrandColors.deepBlue,
  tabBarBackground: '#FFFFFF',
  tabBarActive: BrandColors.deepBlue,
  tabBarInactive: '#8E9AA8',
  cardShadow: 'rgba(0, 29, 57, 0.05)',
  statusGreen: BrandColors.success,
  statusRed: BrandColors.danger,
};

export const DarkTheme: ThemeColors = {
  mode: 'dark',
  background: BrandColors.nightBlue,
  surface: '#072648',
  surfaceCard: '#0A3159',
  surfaceCardAlt: '#0E3D6E',
  headerBackground: '#001428',
  headerText: '#FFFFFF',
  textPrimary: '#FBFBFD',
  textSecondary: BrandColors.skyBlue,
  textMuted: BrandColors.slateBlue,
  textInverse: '#001D39',
  accent: BrandColors.skyBlue,
  accentLight: BrandColors.petrolBlue,
  highlight: BrandColors.skyBlue,
  border: '#173F68',
  borderFocus: BrandColors.skyBlue,
  tabBarBackground: '#041B33',
  tabBarActive: BrandColors.skyBlue,
  tabBarInactive: BrandColors.slateBlue,
  cardShadow: 'rgba(0, 0, 0, 0.25)',
  statusGreen: '#34D399',
  statusRed: '#F87171',
};
