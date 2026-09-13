// Componente JKCard para tarjetas de superficie limpia con bordes suaves
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface JKCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined' | 'accent';
}

export const JKCard: React.FC<JKCardProps> = ({
  children,
  style,
  onPress,
  variant = 'flat',
}) => {
  const { theme, isDarkMode } = useThemeStore();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: theme.surfaceCard,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'elevated':
        return {
          backgroundColor: theme.surfaceCard,
          shadowColor: isDarkMode ? '#000000' : '#001D39',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: 3,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'accent':
        return {
          backgroundColor: isDarkMode ? theme.surfaceCardAlt : theme.surfaceCardAlt,
          borderLeftWidth: 4,
          borderLeftColor: theme.accent,
        };
      case 'flat':
      default:
        return {
          backgroundColor: theme.surfaceCard,
          borderWidth: 1,
          borderColor: theme.border,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.base, getContainerStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, getContainerStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
});
