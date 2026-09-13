// Store para gestión de preferencias visuales, moneda y modo claro/oscuro
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, ThemeColors } from '../theme/colors';

interface ThemeState {
  isDarkMode: boolean;
  theme: ThemeColors;
  currency: string;
  hasSeenOnboarding: boolean;
  isBiometricsEnabled: boolean;
  toggleTheme: () => void;
  setDarkMode: (val: boolean) => void;
  setCurrency: (c: string) => void;
  setHasSeenOnboarding: (val: boolean) => void;
  setBiometricsEnabled: (val: boolean) => void;
  loadPreferences: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  theme: LightTheme,
  currency: 'DOP',
  hasSeenOnboarding: false,
  isBiometricsEnabled: false,

  toggleTheme: () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next, theme: next ? DarkTheme : LightTheme });
    AsyncStorage.setItem('@joekat_dark_mode', JSON.stringify(next));
  },

  setDarkMode: (val: boolean) => {
    set({ isDarkMode: val, theme: val ? DarkTheme : LightTheme });
    AsyncStorage.setItem('@joekat_dark_mode', JSON.stringify(val));
  },

  setCurrency: (currency: string) => {
    set({ currency });
    AsyncStorage.setItem('@joekat_currency', currency);
  },

  setHasSeenOnboarding: (val: boolean) => {
    set({ hasSeenOnboarding: val });
    AsyncStorage.setItem('@joekat_onboarding_done', JSON.stringify(val));
  },

  setBiometricsEnabled: (val: boolean) => {
    set({ isBiometricsEnabled: val });
    AsyncStorage.setItem('@joekat_biometrics', JSON.stringify(val));
  },

  loadPreferences: async () => {
    try {
      const [darkVal, currVal, onbVal, bioVal] = await Promise.all([
        AsyncStorage.getItem('@joekat_dark_mode'),
        AsyncStorage.getItem('@joekat_currency'),
        AsyncStorage.getItem('@joekat_onboarding_done'),
        AsyncStorage.getItem('@joekat_biometrics'),
      ]);

      const isDark = darkVal ? JSON.parse(darkVal) : false;
      const currency = currVal || 'DOP';
      const hasSeenOnboarding = onbVal ? JSON.parse(onbVal) : false;
      const isBiometricsEnabled = bioVal ? JSON.parse(bioVal) : false;

      set({
        isDarkMode: isDark,
        theme: isDark ? DarkTheme : LightTheme,
        currency,
        hasSeenOnboarding,
        isBiometricsEnabled,
      });
    } catch {
      // Uso de valores por defecto
    }
  },
}));
