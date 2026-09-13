// =====================================================================
// DESIGN TOKENS - JOEKAT FINANCE FINTECH PREMIUM
// Paleta: Verde profundo, Verde financiero, Azul oscuro, Marfil, Glassmorphism
// =====================================================================

export const Colors = {
  // Paleta principal
  primaryGreen: '#0F766E',      // Verde profundo (éxito, ingresos, crecimiento)
  secondaryGreen: '#14B8A6',    // Verde financiero secundario (acentos, highlights)
  darkNavy: '#071827',          // Azul oscuro principal (fondos, estructura, navegación)
  secondaryNavy: '#102A43',     // Azul secundario (superficies, tarjetas oscuras)
  accentNavy: '#1E3A5F',        // Azul medio para bordes activos y detalles
  ivoryWhite: '#F8F5EC',        // Blanco marfil (textos principales, áreas claras)
  ivoryTranslucent: 'rgba(248, 245, 236, 0.75)', // Subtítulos y microinfo
  ivoryMuted: 'rgba(248, 245, 236, 0.50)',       // Textos tenues

  // Glassmorphism & Transparencias
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBgStrong: 'rgba(255, 255, 255, 0.12)',
  glassBgSubtle: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.20)',
  navGlassBg: 'rgba(7, 24, 39, 0.88)',

  // Estados semánticos
  income: '#14B8A6',
  incomeBg: 'rgba(20, 184, 166, 0.15)',
  expense: '#F87171',
  expenseBg: 'rgba(248, 113, 113, 0.15)',
  transfer: '#60A5FA',
  transferBg: 'rgba(96, 165, 250, 0.15)',
  savings: '#10B981',
  savingsBg: 'rgba(16, 185, 129, 0.15)',
  debt: '#F59E0B',
  debtBg: 'rgba(245, 158, 11, 0.15)',

  // Responsables
  joel: '#14B8A6',
  joelBg: 'rgba(20, 184, 166, 0.18)',
  kath: '#0F766E',
  kathBg: 'rgba(15, 118, 110, 0.22)',
  shared: '#F8F5EC',
  sharedBg: 'rgba(248, 245, 236, 0.18)',

  // Alertas de presupuesto
  budgetNormal: '#14B8A6',
  budgetWarning: '#FBBF24',
  budgetAlert: '#F97316',
  budgetExceeded: '#EF4444',
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,      // Botones
  lg: 18,      // Tarjetas medianas y modales
  xl: 24,      // Tarjetas principales de dashboard
  pill: 9999,  // Botón flotante y chips
};

export const GlassStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 4,
  },
  cardIvory: {
    backgroundColor: 'rgba(248, 245, 236, 0.09)',
    borderColor: 'rgba(248, 245, 236, 0.16)',
    borderWidth: 1,
  },
  nav: {
    backgroundColor: 'rgba(7, 24, 39, 0.88)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderTopWidth: 1,
  },
};
