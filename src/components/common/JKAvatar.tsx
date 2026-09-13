// Componente JKAvatar para Joel y Kat
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors } from '../../theme/colors';

interface JKAvatarProps {
  name: string;
  size?: number;
  avatarUrl?: string;
  showBadge?: boolean;
}

export const JKAvatar: React.FC<JKAvatarProps> = ({
  name,
  size = 40,
  avatarUrl,
  showBadge = false,
}) => {
  const { theme } = useThemeStore();
  const isKath = (name || '').toLowerCase().includes('kat');
  const initial = isKath ? 'K' : 'J';
  const bgColor = isKath ? KathColors.primary : BrandColors.deepBlue;
  const badgeColor = isKath ? KathColors.light : BrandColors.skyBlue;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={[styles.image, { borderRadius: size / 2 }]} />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
              borderColor: theme.surface,
            },
          ]}
        >
          <Text style={[styles.initialText, { fontSize: size * 0.44 }]}>{initial}</Text>
        </View>
      )}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              borderColor: theme.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
});
