// Punto de entrada de la aplicación JOEKAT FINACE
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import { useFinanceStore } from './src/store/financeStore';
import { useAuthStore } from './src/store/authStore';
import { authenticateWithBiometrics } from './src/services/biometrics';
import { BrandColors } from './src/theme/colors';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { JKToast } from './src/components/common/JKToast';
import { initAlertPolyfill } from './src/utils/alertPolyfill';

initAlertPolyfill();

export default function App() {
  const { loadPreferences, isDarkMode, isBiometricsEnabled } = useThemeStore();
  const { loadLocalData, subscribeToRealtime } = useFinanceStore();
  const { checkSession } = useAuthStore();

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticatedWithBio, setIsAuthenticatedWithBio] = useState(false);

  useEffect(() => {
    let unsubscribeRealtime = () => {};

    const initializeApp = async () => {
      try {
        await Promise.all([
          loadPreferences(),
          loadLocalData(),
          checkSession(),
          Font.loadAsync(Ionicons.font).catch(() => {}),
        ]);
        unsubscribeRealtime = subscribeToRealtime();

        const currentBio = useThemeStore.getState().isBiometricsEnabled;
        if (currentBio) {
          const success = await authenticateWithBiometrics('Desbloquear JOEKAT FINACE');
          setIsAuthenticatedWithBio(success);
        } else {
          setIsAuthenticatedWithBio(true);
        }
      } catch {
        setIsAuthenticatedWithBio(true);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    return () => {
      unsubscribeRealtime();
    };
  }, []);

  if (!isReady || !isAuthenticatedWithBio) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.skyBlue} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <RootNavigator />
      <JKToast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: BrandColors.nightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
