// Componente JKModal para diálogos y acciones modales
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface JKModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const JKModal: React.FC<JKModalProps> = ({ visible, onClose, title, children }) => {
  const { theme, isDarkMode } = useThemeStore();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            styles.dialog,
            {
              backgroundColor: isDarkMode ? theme.surfaceCard : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              borderWidth: 1,
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                } as any)
              : null,
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title || ''}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 29, 57, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  outsideTouch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title3,
    fontWeight: '700',
  },
  body: {
    width: '100%',
  },
});
