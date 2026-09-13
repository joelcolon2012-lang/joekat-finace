// Pantalla de Perfil y Hogar Familiar Compartido
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { JKAvatar } from '../../components/common/JKAvatar';
import { JKButton } from '../../components/common/JKButton';
import { isSupabaseConfigured } from '../../services/supabase';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const ProfileScreen: React.FC = () => {
  const { currentUser, household, activeMember, switchMember, signOut } = useAuthStore();
  const { theme } = useThemeStore();
  const isSupabaseLive = isSupabaseConfigured();

  const handleCopyCode = () => {
    Alert.alert(
      'Código de Invitación',
      `El código de vinculación para tu pareja es: ${household?.invite_code || 'JK2026'}. Compártelo para que pueda sincronizar sus finanzas en su teléfono.`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta Hogar Hero */}
        <View style={[styles.householdHero, { backgroundColor: BrandColors.nightBlue }]}>
          <View style={styles.avatarsCombinedRow}>
            <View style={styles.avatarLeft}>
              <JKAvatar name="Joel" size={54} />
            </View>
            <View style={styles.avatarRight}>
              <JKAvatar name="Kat" size={54} />
            </View>
          </View>
          <Text style={styles.householdTitle}>{household?.name || 'Hogar Joel & Kat'}</Text>
          <Text style={styles.householdSubtitle}>Finanzas Familiares Compartidas</Text>

          {/* Código de Invitación Familiar */}
          <View style={styles.inviteCodeBadge}>
            <View>
              <Text style={styles.inviteLabel}>CÓDIGO DE VINCULACIÓN</Text>
              <Text style={styles.inviteCodeText}>{household?.invite_code || 'JK2026'}</Text>
            </View>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color={BrandColors.nightBlue} />
              <Text style={styles.copyBtnText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Miembros del Hogar */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Miembros del Hogar</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Ambos tienen control total para registrar ingresos, gastos, ver balances y metas.
          </Text>

          {/* Fila Joel */}
          <View style={styles.memberItemRow}>
            <View style={styles.memberItemLeft}>
              <JKAvatar name="Joel" size={40} showBadge={activeMember === 'Joel'} />
              <View style={styles.memberItemText}>
                <Text style={[styles.memberName, { color: theme.textPrimary }]}>Joel</Text>
                <Text style={[styles.memberRole, { color: theme.textMuted }]}>
                  Administrador • joel@joekat.finace
                </Text>
              </View>
            </View>
            {activeMember === 'Joel' ? (
              <View style={[styles.currentPill, { backgroundColor: BrandColors.lightSky }]}>
                <Text style={styles.currentPillText}>Activo</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => switchMember('Joel')}
                style={[styles.switchBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.switchBtnText, { color: BrandColors.deepBlue }]}>Cambiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Fila Kat */}
          <View style={[styles.memberItemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.memberItemLeft}>
              <JKAvatar name="Kat" size={40} showBadge={activeMember === 'Kat'} />
              <View style={styles.memberItemText}>
                <Text style={[styles.memberName, { color: theme.textPrimary }]}>Kat</Text>
                <Text style={[styles.memberRole, { color: theme.textMuted }]}>
                  Administradora • kat@joekat.finace
                </Text>
              </View>
            </View>
            {activeMember === 'Kat' ? (
              <View style={[styles.currentPill, { backgroundColor: BrandColors.lightSky }]}>
                <Text style={styles.currentPillText}>Activo</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => switchMember('Kat')}
                style={[styles.switchBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.switchBtnText, { color: BrandColors.deepBlue }]}>Cambiar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Estado de Sincronización y Seguridad RLS */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.syncHeaderRow}>
            <Ionicons
              name={isSupabaseLive ? 'cloud-done' : 'shield-checkmark'}
              size={20}
              color={BrandColors.deepBlue}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Seguridad & Privacidad
            </Text>
          </View>
          <Text style={[styles.syncDesc, { color: theme.textSecondary }]}>
            Row Level Security (RLS) activo. Únicamente Joel y Kat tienen acceso a los registros de este hogar. Ningún usuario externo puede visualizar su información financiera.
          </Text>
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color={BrandColors.success} style={{ marginRight: 6 }} />
            <Text style={[styles.securityBadgeText, { color: BrandColors.success }]}>
              {isSupabaseLive
                ? 'Conexión Segura Supabase Realtime Activa'
                : 'Modo Privado Local con Caché Persistente Activo'}
            </Text>
          </View>
        </View>

        {/* Cerrar Sesión */}
        <JKButton
          title="Cerrar Sesión Familiar"
          onPress={() => {
            Alert.alert('Cerrar Sesión', '¿Deseas salir de la aplicación?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: signOut },
            ]);
          }}
          variant="outline"
          size="md"
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  householdHero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarsCombinedRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  avatarLeft: {
    zIndex: 2,
  },
  avatarRight: {
    marginLeft: -16,
    zIndex: 1,
  },
  householdTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  householdSubtitle: {
    color: BrandColors.skyBlue,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inviteCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  inviteLabel: {
    color: BrandColors.slateBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inviteCodeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.skyBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  copyBtnText: {
    color: BrandColors.nightBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  memberItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberItemText: {
    marginLeft: Spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 11,
    marginTop: 2,
  },
  currentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  currentPillText: {
    color: BrandColors.nightBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  syncDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
