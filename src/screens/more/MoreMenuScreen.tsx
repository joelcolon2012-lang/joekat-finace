import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { JKAvatar } from '../../components/common/JKAvatar';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface MoreMenuScreenProps {
  navigation: any;
}

export const MoreMenuScreen: React.FC<MoreMenuScreenProps> = ({ navigation }) => {
  const { activeMember, switchMember, household } = useAuthStore();
  const { theme, isDarkMode, toggleTheme, currency } = useThemeStore();

  const menuItems = [
    {
      title: 'Presupuestos Mensuales',
      subtitle: 'Límites de gasto por categorías',
      icon: 'pie-chart-outline',
      color: BrandColors.deepBlue,
      screen: 'Budgets',
    },
    {
      title: 'Metas de Ahorro',
      subtitle: 'Vacaciones, inicial vivienda y fondo',
      icon: 'flag-outline',
      color: BrandColors.skyBlue,
      screen: 'SavingGoals',
    },
    {
      title: 'Gastos Fijos',
      subtitle: 'Alquiler, servicios y compromisos',
      icon: 'calendar-outline',
      color: BrandColors.petrolBlue,
      screen: 'FixedExpenses',
    },
    {
      title: 'Cuentas Familiares',
      subtitle: 'Efectivo, tarjetas y bancos',
      icon: 'wallet-outline',
      color: BrandColors.nightBlue,
      screen: 'Accounts',
    },
    {
      title: 'Reportes y Cierres',
      subtitle: 'Descarga PDF, CSV y cierre de mes',
      icon: 'document-text-outline',
      color: BrandColors.deepBlue,
      screen: 'MonthlyReport',
    },
    {
      title: 'Hogar y Perfil Familiar',
      subtitle: `${household?.name || 'Hogar Joel & Kat'} • Código: ${household?.invite_code || 'JK2026'}`,
      icon: 'home-outline',
      color: BrandColors.mediumBlue,
      screen: 'Profile',
    },
    {
      title: 'Configuración',
      subtitle: `Moneda: ${currency} • Seguridad • Modo visual`,
      icon: 'settings-outline',
      color: BrandColors.slateBlue,
      screen: 'Settings',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Perfil Rápido */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDarkMode ? theme.surfaceCard : '#FFFFFF',
              borderColor: isDarkMode ? theme.border : 'rgba(7, 24, 39, 0.08)',
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any)
              : null,
          ]}
        >
          <JKAvatar name={activeMember} size={50} showBadge={true} />
          <View style={styles.profileInfoCol}>
            <Text style={[styles.memberName, { color: theme.textPrimary }]}>{activeMember}</Text>
            <Text style={[styles.householdSub, { color: theme.textSecondary }]}>
              {household?.name || 'Hogar Joel & Kat'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => switchMember(activeMember === 'Joel' ? 'Kat' : 'Joel')}
            style={[
              styles.switchMemberBtn,
              { backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.2)' : 'rgba(15, 118, 110, 0.1)' },
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={!isDarkMode ? '#0F766E' : BrandColors.nightBlue}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.switchMemberText, !isDarkMode && { color: '#0F766E' }]}>
              Ver como {activeMember === 'Joel' ? 'Kat' : 'Joel'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interruptor de Modo Oscuro Rápido */}
        <View
          style={[
            styles.themeRow,
            {
              backgroundColor: isDarkMode ? theme.surfaceCard : '#FFFFFF',
              borderColor: isDarkMode ? theme.border : 'rgba(7, 24, 39, 0.08)',
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any)
              : null,
          ]}
        >
          <View style={styles.themeLeft}>
            <Ionicons
              name={isDarkMode ? 'moon' : 'sunny'}
              size={20}
              color={isDarkMode ? BrandColors.skyBlue : BrandColors.deepBlue}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.themeText, { color: theme.textPrimary }]}>
              {isDarkMode ? 'Modo Oscuro Activado' : 'Modo Claro Activado'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: BrandColors.deepBlue }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Elementos del Menú */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen)}
              style={[
                styles.menuItemCard,
                {
                  backgroundColor: isDarkMode ? theme.surfaceCard : '#FFFFFF',
                  borderColor: isDarkMode ? theme.border : 'rgba(7, 24, 39, 0.08)',
                },
                Platform.OS === 'web'
                  ? ({
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                    } as any)
                  : null,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>

              <View style={styles.menuTextCol}>
                <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.menuSubtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '800',
  },
  householdSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  switchMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  switchMemberText: {
    color: BrandColors.nightBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    gap: 8,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
