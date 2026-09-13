// Componente JKButton para acciones de alta respuesta táctil
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface JKButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const JKButton: React.FC<JKButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { theme, isDarkMode } = useThemeStore();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
          text: {
            color: isDarkMode ? '#FFFFFF' : '#071827',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDarkMode ? '#14B8A6' : '#0F766E',
          },
          text: {
            color: isDarkMode ? '#14B8A6' : '#0F766E',
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: BrandColors.danger,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: isDarkMode ? '#14B8A6' : '#0F766E',
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: BrandColors.deepBlue,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 54 },
          text: { fontSize: 16, fontWeight: '700' },
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 46 },
          text: { fontSize: 15, fontWeight: '600' },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        sizeStyle.container,
        variantStyle.container,
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.accent : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.baseText, sizeStyle.text, variantStyle.text, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    letterSpacing: -0.2,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
