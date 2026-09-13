import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Radius } from '../../theme/designTokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'strong' | 'subtle' | 'ivory' | 'accent';
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
  let bg = 'rgba(255, 255, 255, 0.08)';
  let border = 'rgba(255, 255, 255, 0.12)';

  if (variant === 'strong') {
    bg = 'rgba(255, 255, 255, 0.13)';
    border = 'rgba(255, 255, 255, 0.20)';
  } else if (variant === 'subtle') {
    bg = 'rgba(255, 255, 255, 0.04)';
    border = 'rgba(255, 255, 255, 0.08)';
  } else if (variant === 'ivory') {
    bg = 'rgba(248, 245, 236, 0.09)';
    border = 'rgba(248, 245, 236, 0.18)';
  } else if (variant === 'accent') {
    bg = 'rgba(15, 118, 110, 0.18)';
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
