import { Alert, Platform } from 'react-native';

/**
 * Polyfill para Alert.alert en React Native Web.
 * En react-native-web, Alert.alert es una función vacía por defecto.
 * Este polyfill permite que los diálogos de confirmación y alertas funcionen en iOS Safari y navegadores web.
 */
export function initAlertPolyfill() {
  if (Platform.OS === 'web') {
    Alert.alert = (title: string, message?: string, buttons?: any[]) => {
      const fullMessage = message ? `${title}\n\n${message}` : title;

      if (!buttons || buttons.length === 0) {
        if (typeof window !== 'undefined') {
          window.alert(fullMessage);
        }
        return;
      }

      if (buttons.length === 1) {
        if (typeof window !== 'undefined') {
          window.alert(fullMessage);
        }
        buttons[0]?.onPress?.();
        return;
      }

      // Dos o más botones (ej: Cancelar y Eliminar)
      const confirmed = typeof window !== 'undefined' ? window.confirm(fullMessage) : true;
      if (confirmed) {
        const confirmBtn =
          buttons.find((b) => b.style === 'destructive') ||
          buttons.find((b) => b.style !== 'cancel') ||
          buttons[buttons.length - 1];
        confirmBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
    };
  }
}
