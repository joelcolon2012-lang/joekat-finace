// Componente JKProgressBar con límites y semáforo visual para presupuestos y metas
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors } from '../../theme/colors';

interface JKProgressBarProps {
  progress: number; // 0 a 100
  color?: string;
  height?: number;
  autoColor?: boolean;
  style?: ViewStyle;
}

export const JKProgressBar: React.FC<JKProgressBarProps> = ({
  progress,
  color,
  height = 8,
  autoColor = true,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getBarColor = (): string => {
    if (color) return color;
    if (!autoColor) return BrandColors.deepBlue;

    if (clampedProgress >= 100) {
      return BrandColors.danger; // Límite superado
    } else if (clampedProgress >= 80) {
      return BrandColors.warning; // Cerca del límite
    } else {
      return BrandColors.deepBlue; // Dentro de lo planeado
    }
  };

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: getBarColor(),
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
