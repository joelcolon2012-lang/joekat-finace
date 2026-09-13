// Componente JKAmountInput para ingreso ágil de cantidades monetarias en RD$
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface JKAmountInputProps {
  amount: string;
  onChangeAmount: (text: string) => void;
  currencyPrefix?: string;
  label?: string;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const JKAmountInput: React.FC<JKAmountInputProps> = ({
  amount,
  onChangeAmount,
  currencyPrefix = 'RD$',
  label = 'Monto del movimiento',
  autoFocus = false,
  style,
}) => {
  const { theme } = useThemeStore();

  const handleQuickAdd = (increment: number) => {
    const current = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const next = current + increment;
    onChangeAmount(next.toString());
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderFocus,
          },
        ]}
      >
        <Text style={[styles.prefix, { color: BrandColors.nightBlue }]}>{currencyPrefix}</Text>
        <TextInput
          value={amount}
          onChangeText={(text) => {
            // Permitir solo números y punto
            const cleaned = text.replace(/[^0-9.]/g, '');
            onChangeAmount(cleaned);
          }}
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          keyboardType="decimal-pad"
          style={[styles.numericInput, { color: theme.textPrimary }]}
          autoFocus={autoFocus}
        />
      </View>

      {/* Botones de incremento rápido */}
      <View style={styles.presetsRow}>
        {[100, 500, 1000, 5000].map((inc) => (
          <TouchableOpacity
            key={inc}
            onPress={() => handleQuickAdd(inc)}
            style={[styles.presetChip, { backgroundColor: theme.surfaceCardAlt, borderColor: theme.border }]}
          >
            <Text style={[styles.presetText, { color: BrandColors.deepBlue }]}>+{inc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  prefix: {
    fontSize: 26,
    fontWeight: '800',
    marginRight: Spacing.sm,
  },
  numericInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
