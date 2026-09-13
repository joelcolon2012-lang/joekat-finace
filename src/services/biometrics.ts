// Servicio de autenticación biométrica (Face ID / Huella / Biometría Android) para JOEKAT FINACE
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCheckResult {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
}

export const checkBiometricSupport = async (): Promise<BiometricCheckResult> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      hasHardware,
      isEnrolled,
      biometricTypes,
    };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      biometricTypes: [],
    };
  }
};

export const authenticateWithBiometrics = async (
  promptMessage = 'Acceso a JOEKAT FINACE'
): Promise<boolean> => {
  try {
    const { hasHardware, isEnrolled } = await checkBiometricSupport();
    if (!hasHardware || !isEnrolled) {
      return true; // Si el dispositivo no tiene biometría configurada, permitir paso
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Ingresar PIN',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch {
    return true; // En caso de fallo de hardware imprevisto
  }
};
