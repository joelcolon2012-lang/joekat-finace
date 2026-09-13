import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Radius } from '../../theme/designTokens';

import { useThemeStore } from '../../store/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'strong' | 'subtle' | 'ivory' | 'accent' | 'dark';
  borderRadius?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  borderRadius = Radius.xl,
  padding = 16,
}) => {
  const { isDarkMode } = useThemeStore();

  let bg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.92)';
  let border = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  if (variant === 'dark') {
    bg = '#071827';
    border = 'rgba(255, 255, 255, 0.12)';
  } else if (variant === 'strong') {
    bg = isDarkMode ? 'rgba(255, 255, 255, 0.13)' : '#FFFFFF';
    border = isDarkMode ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.10)';
  } else if (variant === 'subtle') {
    bg = isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(248, 250, 252, 0.85)';
    border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  } else if (variant === 'accent') {
    bg = isDarkMode ? 'rgba(15, 118, 110, 0.18)' : 'rgba(15, 118, 110, 0.08)';
    border = 'rgba(20, 184, 166, 0.35)';
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius,
          padding,
        },
        Platform.OS === 'web' ? ({
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        } as any) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
  },
});
