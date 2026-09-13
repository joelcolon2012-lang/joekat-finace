// Pantalla de Onboarding y Bienvenida para JOEKAT FINACE
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { BrandColors } from '../../theme/colors';
import { JKButton } from '../../components/common/JKButton';
import { JKInput } from '../../components/common/JKInput';
import { JKModal } from '../../components/common/JKModal';
import { Spacing, BorderRadius } from '../../theme/spacing';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'joekat finace',
    subtitle: 'Together for a brighter tomorrow',
    description: 'La aplicación privada de finanzas familiares diseñada exclusivamente para Joel y Kat.',
    showLogo: true,
  },
  {
    id: 2,
    title: 'Tus finanzas. Un solo lugar.',
    subtitle: 'Control total y compartido',
    description: 'Ingresos, gastos, balances y cuentas organizados con sincronización en tiempo real.',
    showLogo: true,
  },
  {
    id: 3,
    title: 'Construyan juntos el futuro que quieren.',
    subtitle: 'Metas, presupuestos y salud financiera',
    description: 'Monitoreen su capacidad de ahorro familiar y alcancen sus metas paso a paso.',
    showLogo: true,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { setHasSeenOnboarding } = useThemeStore();
  const { signInWithEmail, signUpWithEmail, joinHouseholdByCode, switchMember } = useAuthStore();

  const [activeSlide, setActiveSlide] = useState(0);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'join'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMember, setSelectedMember] = useState<'Joel' | 'Kat'>('Joel');
  const [inviteCode, setInviteCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (activeSlide < SLIDES.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      setAuthModalVisible(true);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    setIsSubmitting(true);

    if (authMode === 'login') {
      const success = await signInWithEmail(email || `${selectedMember.toLowerCase()}@joekat.finace`, password || '123456');
      if (success) {
        setHasSeenOnboarding(true);
      } else {
        setAuthError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } else if (authMode === 'register') {
      const success = await signUpWithEmail(
        email || `${selectedMember.toLowerCase()}@joekat.finace`,
        password || '123456',
        selectedMember
      );
      if (success) {
        setHasSeenOnboarding(true);
      } else {
        setAuthError('Error al registrar usuario.');
      }
    } else {
      const success = await joinHouseholdByCode(inviteCode);
      if (success) {
        setHasSeenOnboarding(true);
      } else {
        setAuthError('Código inválido. Usa JK2026 para unirte.');
      }
    }

    setIsSubmitting(false);
  };

  const handleQuickEnter = (member: 'Joel' | 'Kat') => {
    switchMember(member);
    setHasSeenOnboarding(true);
  };

  const current = SLIDES[activeSlide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContent}>
        {/* Logotipo Oficial Suministrado */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Textos del Slide */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{current.title}</Text>
          <Text style={styles.subtitleText}>{current.subtitle}</Text>
          <Text style={styles.descText}>{current.description}</Text>
        </View>

        {/* Indicadores de Puntos */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeSlide ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Botones de Acción */}
      <View style={styles.bottomActions}>
        {activeSlide < SLIDES.length - 1 ? (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setAuthModalVisible(true)} style={styles.skipBtn}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
            <JKButton
              title="Continuar"
              onPress={handleNext}
              variant="primary"
              size="lg"
              style={{ flex: 1, marginLeft: Spacing.md }}
            />
          </View>
        ) : (
          <View style={styles.actionColumn}>
            <JKButton
              title="Comenzar como Joel"
              onPress={() => handleQuickEnter('Joel')}
              variant="primary"
              size="lg"
              style={styles.btnFull}
            />
            <JKButton
              title="Comenzar como Kat"
              onPress={() => handleQuickEnter('Kat')}
              variant="secondary"
              size="lg"
              style={[styles.btnFull, { marginTop: Spacing.sm }]}
            />
            <TouchableOpacity
              onPress={() => {
                setAuthMode('login');
                setAuthModalVisible(true);
              }}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Iniciar sesión con correo o Supabase</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de Autenticación / Registro / Vincular */}
      <JKModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        title={
          authMode === 'login'
            ? 'Iniciar Sesión'
            : authMode === 'register'
            ? 'Crear Cuenta'
            : 'Vincular Hogar'
        }
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {authMode !== 'join' && (
            <>
              <Text style={styles.selectorLabel}>¿Quién eres?</Text>
              <View style={styles.memberSelectorRow}>
                <TouchableOpacity
                  onPress={() => setSelectedMember('Joel')}
                  style={[
                    styles.memberChip,
                    selectedMember === 'Joel' && styles.memberChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.memberChipText,
                      selectedMember === 'Joel' && styles.memberChipTextSelected,
                    ]}
                  >
                    Joel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedMember('Kat')}
                  style={[
                    styles.memberChip,
                    selectedMember === 'Kat' && styles.memberChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.memberChipText,
                      selectedMember === 'Kat' && styles.memberChipTextSelected,
                    ]}
                  >
                    Kat
                  </Text>
                </TouchableOpacity>
              </View>

              <JKInput
                label="Correo electrónico"
                placeholder={`${selectedMember.toLowerCase()}@joekat.finace`}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <JKInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </>
          )}

          {authMode === 'join' && (
            <JKInput
              label="Código de invitación familiar"
              placeholder="Ej: JK2026"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
          )}

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <JKButton
            title={
              authMode === 'login'
                ? 'Ingresar a JOEKAT FINACE'
                : authMode === 'register'
                ? 'Registrarse y Vincular'
                : 'Unirse al Hogar'
            }
            onPress={handleAuthSubmit}
            loading={isSubmitting}
            variant="primary"
            size="md"
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.modalToggleRow}>
            {authMode === 'login' ? (
              <TouchableOpacity onPress={() => setAuthMode('register')}>
                <Text style={styles.modalToggleText}>¿No tienes cuenta? Regístrate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setAuthMode('login')}>
                <Text style={styles.modalToggleText}>¿Ya tienes cuenta? Inicia sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </JKModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: BrandColors.nightBlue,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: BrandColors.deepBlue,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.mediumBlue,
    textAlign: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: BrandColors.deepBlue,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  bottomActions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: BrandColors.slateBlue,
    fontWeight: '600',
    fontSize: 15,
  },
  actionColumn: {
    width: '100%',
  },
  btnFull: {
    width: '100%',
  },
  loginLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginLinkText: {
    color: BrandColors.deepBlue,
    fontWeight: '600',
    fontSize: 13,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.nightBlue,
    marginBottom: 6,
  },
  memberSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  memberChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  memberChipSelected: {
    backgroundColor: BrandColors.deepBlue,
    borderColor: BrandColors.deepBlue,
  },
  memberChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.nightBlue,
  },
  memberChipTextSelected: {
    color: '#FFFFFF',
  },
  errorText: {
    color: BrandColors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  modalToggleRow: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalToggleText: {
    color: BrandColors.deepBlue,
    fontSize: 13,
    fontWeight: '600',
  },
});
