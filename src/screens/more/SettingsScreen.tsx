// Pantalla de Configuración de JOEKAT FINACE
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { authenticateWithBiometrics } from '../../services/biometrics';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    isDarkMode,
    toggleTheme,
    currency,
    setCurrency,
    isBiometricsEnabled,
    setBiometricsEnabled,
  } = useThemeStore();

  const currencies = [
    { code: 'DOP', symbol: 'RD$', label: 'Peso Dominicano (Predeterminado)' },
    { code: 'USD', symbol: 'US$', label: 'Dólar Estadounidense' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
  ];

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const authenticated = await authenticateWithBiometrics('Configurar Face ID / Biometría');
      if (authenticated) {
        setBiometricsEnabled(true);
        Alert.alert('Seguridad Activada', 'Face ID / Biometría habilitada para proteger la aplicación.');
      } else {
        Alert.alert('Autenticación Fallida', 'No se pudo verificar la biometría.');
      }
    } else {
      setBiometricsEnabled(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>PREFERENCIAS VISUALES</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Modo Oscuro</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                Aplica la paleta oficial #001D39 de noche profunda
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: BrandColors.deepBlue }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>SISTEMA MONETARIO</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          {currencies.map((c, index) => {
            const isSelected = currency === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                activeOpacity={0.7}
                onPress={() => setCurrency(c.code)}
                style={[
                  styles.currencyRow,
                  index < currencies.length - 1 && styles.borderBottom,
                  { borderBottomColor: theme.border },
                ]}
              >
                <View style={styles.currencyLeft}>
                  <View style={[styles.symbolPill, { backgroundColor: `${BrandColors.deepBlue}15` }]}>
                    <Text style={[styles.symbolText, { color: BrandColors.deepBlue }]}>{c.symbol}</Text>
                  </View>
                  <View>
                    <Text style={[styles.currencyName, { color: theme.textPrimary }]}>{c.code}</Text>
                    <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>{c.label}</Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={BrandColors.deepBlue} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>SEGURIDAD</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                Face ID / Huella Dactilar
              </Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                Solicitar autenticación biométrica al abrir JOEKAT FINACE
              </Text>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#CBD5E1', true: BrandColors.deepBlue }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>ACERCA DE LA APLICACIÓN</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textPrimary }]}>Aplicación</Text>
            <Text style={[styles.aboutValue, { color: theme.textSecondary }]}>JOEKAT FINACE</Text>
          </View>
          <View style={[styles.aboutRow, styles.borderTop, { borderTopColor: theme.border }]}>
            <Text style={[styles.aboutLabel, { color: theme.textPrimary }]}>Lema Oficial</Text>
            <Text style={[styles.aboutValue, { color: theme.textSecondary }]}>
              Together for a brighter tomorrow
            </Text>
          </View>
          <View style={[styles.aboutRow, styles.borderTop, { borderTopColor: theme.border }]}>
            <Text style={[styles.aboutLabel, { color: theme.textPrimary }]}>Versión</Text>
            <Text style={[styles.aboutValue, { color: theme.textSecondary }]}>1.0.0 (Producción)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  card: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingTextCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '800',
  },
  currencyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  borderTop: {
    borderTopWidth: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '500',
  },
});
