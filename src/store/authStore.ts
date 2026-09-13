// Store de Autenticación y Gestión de Miembros Familiares para JOEKAT FINACE
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Household, FamilyMemberName } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthState {
  currentUser: UserProfile;
  household: Household;
  isAuthenticated: boolean;
  activeMember: FamilyMemberName;
  isLoading: boolean;
  error: string | null;

  switchMember: (name: FamilyMemberName) => void;
  setHousehold: (household: Household) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, name: FamilyMemberName) => Promise<boolean>;
  joinHouseholdByCode: (code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const DEFAULT_HOUSEHOLD: Household = {
  id: 'hh-joel-kat-01',
  name: 'Hogar Joel & Kath',
  invite_code: 'JK2026',
  created_at: new Date().toISOString(),
};

const DEFAULT_USER: UserProfile = {
  id: 'user-joel-01',
  email: 'joel@joekat.finace',
  name: 'Joel',
  preferred_currency: 'DOP',
  household_id: DEFAULT_HOUSEHOLD.id,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: DEFAULT_USER,
  household: DEFAULT_HOUSEHOLD,
  isAuthenticated: true, // Habilitado para uso inmediato y privado
  activeMember: 'Joel',
  isLoading: false,
  error: null,

  switchMember: (name: FamilyMemberName) => {
    const updatedUser = {
      ...get().currentUser,
      name,
      email: `${name.toLowerCase()}@joekat.finace`,
    };
    set({ activeMember: name, currentUser: updatedUser });
    AsyncStorage.setItem('@joekat_active_member', name);
  },

  setHousehold: (household: Household) => {
    set({ household });
    AsyncStorage.setItem('@joekat_household', JSON.stringify(household));
  },

  updateProfile: (profileUpdates: Partial<UserProfile>) => {
    const updated = { ...get().currentUser, ...profileUpdates };
    set({ currentUser: updated });
    AsyncStorage.setItem('@joekat_user_profile', JSON.stringify(updated));
  },

  signInWithEmail: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: email.toLowerCase().includes('kat') ? 'Kat' : 'Joel',
            preferred_currency: 'DOP',
            household_id: DEFAULT_HOUSEHOLD.id,
          };
          set({
            currentUser: profile,
            activeMember: profile.name,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      }

      // Modo local / demostración familiar
      const determinedName: FamilyMemberName = email.toLowerCase().includes('kat') ? 'Kat' : 'Joel';
      const profile: UserProfile = {
        id: `user-${determinedName.toLowerCase()}`,
        email,
        name: determinedName,
        preferred_currency: 'DOP',
        household_id: DEFAULT_HOUSEHOLD.id,
      };
      set({
        currentUser: profile,
        activeMember: determinedName,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.',
        isLoading: false,
      });
      return false;
    }
  },

  signUpWithEmail: async (email: string, pass: string, name: FamilyMemberName) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name,
            preferred_currency: 'DOP',
            household_id: DEFAULT_HOUSEHOLD.id,
          };
          set({
            currentUser: profile,
            activeMember: name,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      }

      const profile: UserProfile = {
        id: `user-${name.toLowerCase()}`,
        email,
        name,
        preferred_currency: 'DOP',
        household_id: DEFAULT_HOUSEHOLD.id,
      };
      set({
        currentUser: profile,
        activeMember: name,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'No pudimos registrar la cuenta. Inténtalo nuevamente.',
        isLoading: false,
      });
      return false;
    }
  },

  joinHouseholdByCode: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simular o validar código de vinculación de hogar
      if (code.trim().toUpperCase() === 'JK2026' || code.trim().length >= 4) {
        const joined: Household = {
          id: 'hh-joel-kat-01',
          name: 'Hogar Joel & Kat',
          invite_code: code.trim().toUpperCase(),
          created_at: new Date().toISOString(),
        };
        set({ household: joined, isLoading: false });
        AsyncStorage.setItem('@joekat_household', JSON.stringify(joined));
        return true;
      }
      set({ error: 'Código de invitación no válido o expirado.', isLoading: false });
      return false;
    } catch {
      set({ error: 'Error al vincular con el hogar.', isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    set({ isAuthenticated: false });
    await AsyncStorage.removeItem('@joekat_active_member');
  },

  checkSession: async () => {
    try {
      const savedMember = await AsyncStorage.getItem('@joekat_active_member');
      if (savedMember) {
        get().switchMember(savedMember as FamilyMemberName);
      }
    } catch {
      // Usar defaults
    }
  },
}));
