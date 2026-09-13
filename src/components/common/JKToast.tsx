// Componente de Toast flotante discreto y sistema de Undo (Deshacer) para JOEKAT FINACE
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, KathColors } from '../../theme/colors';

export interface ToastOptions {
  message: string;
  type?: 'success' | 'info' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

type ToastListener = (options: ToastOptions | null) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (message: string, options?: Omit<ToastOptions, 'message'>) => {
    const payload: ToastOptions = {
      message,
      type: options?.type || 'success',
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      duration: options?.duration || 4000,
    };
    for (const listener of listeners) {
      listener(payload);
    }
  },
  success: (message: string) => {
    toast.show(message, { type: 'success' });
  },
  error: (message: string) => {
    toast.show(message, { type: 'danger' });
  },
  undo: (message: string, onUndo: () => void) => {
    toast.show(message, {
      type: 'info',
      actionLabel: 'Deshacer',
      onAction: onUndo,
      duration: 5000,
    });
  },
};

export const JKToast: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateYAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    let hideTimer: any = null;

    const listener: ToastListener = (options) => {
      if (hideTimer) clearTimeout(hideTimer);

      if (!options) {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start(() => setCurrentToast(null));
        return;
      }

      setCurrentToast(options);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateYAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();

      hideTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: 20, duration: 250, useNativeDriver: true }),
        ]).start(() => setCurrentToast(null));
      }, options.duration || 4000);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [fadeAnim, translateYAnim]);

  if (!currentToast) return null;

  const isUndo = !!currentToast.actionLabel;
  const isDanger = currentToast.type === 'danger';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toastCard,
          Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as any)
            : null,
        ]}
      >
        <View style={styles.iconCol}>
          {isUndo ? (
            <Ionicons name="arrow-undo-circle" size={20} color={BrandColors.skyBlue} />
          ) : isDanger ? (
            <Ionicons name="trash" size={20} color={BrandColors.danger} />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color={BrandColors.success} />
          )}
        </View>

        <Text style={styles.toastMessage} numberOfLines={2}>
          {currentToast.message}
        </Text>

        {currentToast.actionLabel && currentToast.onAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={() => {
              if (currentToast.onAction) {
                currentToast.onAction();
              }
              for (const l of listeners) l(null);
            }}
          >
            <Text style={styles.actionBtnText}>{currentToast.actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 85,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001D39',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '96%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconCol: {
    marginRight: 10,
  },
  toastMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  actionBtn: {
    marginLeft: 14,
    backgroundColor: 'rgba(123, 189, 232, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    color: BrandColors.skyBlue,
    fontSize: 13,
    fontWeight: '700',
  },
});
