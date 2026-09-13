// Componente JKInput con diseño limpio, etiquetas flotantes y validación
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface JKInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const JKInput: React.FC<JKInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const { theme } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? BrandColors.danger : isFocused ? theme.borderFocus : theme.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={theme.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            {
              color: theme.textPrimary,
            },
            inputStyle,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  label: {
    ...Typography.subhead,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: BrandColors.danger,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
