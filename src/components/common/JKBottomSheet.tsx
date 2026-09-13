import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface JKBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const JKBottomSheet: React.FC<JKBottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { theme, isDarkMode } = useThemeStore();

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              } as any)
            : null,
        ]}
      >
        <TouchableOpacity style={styles.outsideTouch} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? theme.surfaceCard : 'rgba(248, 245, 236, 0.98)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(7, 24, 39, 0.08)',
              borderTopWidth: 1,
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                } as any)
              : null,
          ]}
        >
          <SafeAreaView>
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.content}>{children}</View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 29, 57, 0.6)',
    justifyContent: 'flex-end',
  },
  outsideTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.title3,
    fontWeight: '700',
  },
  content: {
    paddingTop: Spacing.xs,
  },
});
