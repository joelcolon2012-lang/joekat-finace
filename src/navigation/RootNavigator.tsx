// Navegador principal con barra inferior de 5 botones y botón flotante (+) distintivo
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { BrandColors } from '../theme/colors';

// Pantallas
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { BalanceAnalyticsScreen } from '../screens/balance/BalanceAnalyticsScreen';
import { MoreMenuScreen } from '../screens/more/MoreMenuScreen';
import { BudgetsScreen } from '../screens/budgets/BudgetsScreen';
import { SavingGoalsScreen } from '../screens/goals/SavingGoalsScreen';
import { FixedExpensesScreen } from '../screens/fixed/FixedExpensesScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { MonthlyReportScreen } from '../screens/reports/MonthlyReportScreen';
import { ProfileScreen } from '../screens/more/ProfileScreen';
import { SettingsScreen } from '../screens/more/SettingsScreen';
import { AddTransactionModal } from '../screens/transactions/AddTransactionModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Stack para el menú Más
const MoreStackNavigator = () => {
  const { theme } = useThemeStore();

  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.headerBackground },
        headerTintColor: theme.headerText,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <MoreStack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ title: 'Más Opciones' }}
      />
      <MoreStack.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{ title: 'Presupuestos' }}
      />
      <MoreStack.Screen
        name="SavingGoals"
        component={SavingGoalsScreen}
        options={{ title: 'Metas de Ahorro' }}
      />
      <MoreStack.Screen
        name="FixedExpenses"
        component={FixedExpensesScreen}
        options={{ title: 'Gastos Fijos' }}
      />
      <MoreStack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: 'Cuentas Familiares' }}
      />
      <MoreStack.Screen
        name="MonthlyReport"
        component={MonthlyReportScreen}
        options={{ title: 'Reporte Mensual' }}
      />
      <MoreStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Hogar & Miembros' }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </MoreStack.Navigator>
  );
};

// Stack para Dashboard con acceso directo a subpantallas
const DashboardStackNavigator = () => {
  const { theme } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.headerBackground },
        headerTintColor: theme.headerText,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FixedExpenses"
        component={FixedExpensesScreen}
        options={{ title: 'Gastos Fijos' }}
      />
      <Stack.Screen
        name="SavingGoals"
        component={SavingGoalsScreen}
        options={{ title: 'Metas de Ahorro' }}
      />
    </Stack.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const { hasSeenOnboarding, theme, isDarkMode } = useThemeStore();
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);

  if (!hasSeenOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDarkMode ? 'rgba(7, 24, 39, 0.88)' : 'rgba(248, 245, 236, 0.90)',
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(7, 24, 39, 0.08)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 86 : 74,
            paddingBottom: Platform.OS === 'ios' ? 24 : 14,
            paddingTop: 8,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
                  height: 'calc(58px + max(14px, env(safe-area-inset-bottom, 14px)))',
                } as any)
              : {}),
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Inicio"
          component={DashboardStackNavigator}
          options={{
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />

        <Tab.Screen
          name="Movimientos"
          component={TransactionsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: theme.headerBackground },
            headerTintColor: theme.headerText,
            headerTitle: 'Historial de Movimientos',
            tabBarLabel: 'Movimientos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Botón Central Flotante Universal (+) */}
        <Tab.Screen
          name="AddAction"
          component={View}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setQuickAddModalVisible(true);
            },
          }}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => (
              <View style={styles.floatingAddButton}>
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Analisis"
          component={BalanceAnalyticsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: theme.headerBackground },
            headerTintColor: theme.headerText,
            headerTitle: 'Análisis Financiero',
            tabBarLabel: 'Análisis',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Perfil"
          component={MoreStackNavigator}
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Modal flotante global del botón central (+) */}
      <AddTransactionModal
        visible={quickAddModalVisible}
        onClose={() => setQuickAddModalVisible(false)}
      />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  floatingAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 14 : 16,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
