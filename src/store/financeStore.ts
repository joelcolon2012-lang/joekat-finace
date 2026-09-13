// Store principal de operaciones financieras familiares para JOEKAT FINACE
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Category,
  Account,
  FixedExpense,
  Budget,
  SavingGoal,
  MonthlySnapshot,
  FixedExpenseStatus,
  FamilyMemberName,
} from '../types';
import { calculateMonthlyTotals, calculateCategoryBreakdown } from '../utils/calculations';
import { roundCurrency } from '../utils/currency';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import {
  fetchRemoteSyncState,
  broadcastMutation,
  startRealtimeSyncConnection,
  subscribeSyncStatus,
  SyncStatus,
} from '../services/realtimeSync';

// Categorías de Ingreso Oficiales
const INITIAL_INCOME_CATEGORIES: Category[] = [
  { id: 'cat-inc-1', name: 'Salario Joel', type: 'income', icon: 'briefcase-outline', color: '#0A4174', is_system: true },
  { id: 'cat-inc-2', name: 'Salario Kat', type: 'income', icon: 'briefcase-outline', color: '#49769F', is_system: true },
  { id: 'cat-inc-3', name: 'Fotografía', type: 'income', icon: 'camera-outline', color: '#4E8EA2', is_system: true },
  { id: 'cat-inc-4', name: 'Medicina', type: 'income', icon: 'pulse-outline', color: '#6EA2B3', is_system: true },
  { id: 'cat-inc-5', name: 'Negocio', type: 'income', icon: 'trending-up-outline', color: '#001D39', is_system: true },
  { id: 'cat-inc-6', name: 'Freelance', type: 'income', icon: 'laptop-outline', color: '#7BBDE8', is_system: true },
  { id: 'cat-inc-7', name: 'Bonificación', type: 'income', icon: 'ribbon-outline', color: '#0A4174', is_system: true },
  { id: 'cat-inc-8', name: 'Inversiones', type: 'income', icon: 'pie-chart-outline', color: '#49769F', is_system: true },
  { id: 'cat-inc-9', name: 'Otros', type: 'income', icon: 'add-circle-outline', color: '#6EA2B3', is_system: true },
];

// Categorías de Gasto Oficiales
const INITIAL_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-exp-1', name: 'Hogar', type: 'expense', icon: 'home-outline', color: '#001D39', is_system: true },
  { id: 'cat-exp-2', name: 'Supermercado', type: 'expense', icon: 'cart-outline', color: '#0A4174', is_system: true },
  { id: 'cat-exp-3', name: 'Restaurantes', type: 'expense', icon: 'cafe-outline', color: '#49769F', is_system: true },
  { id: 'cat-exp-4', name: 'Transporte', type: 'expense', icon: 'car-outline', color: '#4E8EA2', is_system: true },
  { id: 'cat-exp-5', name: 'Gasolina', type: 'expense', icon: 'water-outline', color: '#6EA2B3', is_system: true },
  { id: 'cat-exp-6', name: 'Salud', type: 'expense', icon: 'heart-outline', color: '#7BBDE8', is_system: true },
  { id: 'cat-exp-7', name: 'Medicamentos', type: 'expense', icon: 'medkit-outline', color: '#0A4174', is_system: true },
  { id: 'cat-exp-8', name: 'Educación', type: 'expense', icon: 'book-outline', color: '#49769F', is_system: true },
  { id: 'cat-exp-9', name: 'Internet', type: 'expense', icon: 'wifi-outline', color: '#4E8EA2', is_system: true },
  { id: 'cat-exp-10', name: 'Electricidad', type: 'expense', icon: 'flash-outline', color: '#001D39', is_system: true },
  { id: 'cat-exp-11', name: 'Agua', type: 'expense', icon: 'water-outline', color: '#7BBDE8', is_system: true },
  { id: 'cat-exp-12', name: 'Teléfono', type: 'expense', icon: 'phone-portrait-outline', color: '#6EA2B3', is_system: true },
  { id: 'cat-exp-13', name: 'Suscripciones', type: 'expense', icon: 'tv-outline', color: '#4E8EA2', is_system: true },
  { id: 'cat-exp-14', name: 'Entretenimiento', type: 'expense', icon: 'film-outline', color: '#0A4174', is_system: true },
  { id: 'cat-exp-15', name: 'Ropa', type: 'expense', icon: 'bag-handle-outline', color: '#49769F', is_system: true },
  { id: 'cat-exp-16', name: 'Viajes', type: 'expense', icon: 'compass-outline', color: '#7BBDE8', is_system: true },
  { id: 'cat-exp-17', name: 'Fotografía', type: 'expense', icon: 'camera-outline', color: '#4E8EA2', is_system: true },
  { id: 'cat-exp-18', name: 'Trabajo', type: 'expense', icon: 'briefcase-outline', color: '#001D39', is_system: true },
  { id: 'cat-exp-19', name: 'Familia', type: 'expense', icon: 'people-outline', color: '#6EA2B3', is_system: true },
  { id: 'cat-exp-20', name: 'Otros', type: 'expense', icon: 'help-circle-outline', color: '#8E9AA8', is_system: true },
];

const INITIAL_CATEGORIES = [...INITIAL_INCOME_CATEGORIES, ...INITIAL_EXPENSE_CATEGORIES];

// Cuentas Iniciales Limpias (Comienzan en RD$ 0.00)
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', household_id: 'hh-joel-kat-01', name: 'Cuenta Conjunta', type: 'conjunta', balance: 0.0, color: '#001D39', icon: 'people-outline', is_active: true },
  { id: 'acc-2', household_id: 'hh-joel-kat-01', name: 'Cuenta Joel', type: 'joel', balance: 0.0, color: '#0A4174', icon: 'person-outline', is_active: true },
  { id: 'acc-3', household_id: 'hh-joel-kat-01', name: 'Cuenta Kath', type: 'kath', balance: 0.0, color: '#8E3A62', icon: 'person-outline', is_active: true },
  { id: 'acc-4', household_id: 'hh-joel-kat-01', name: 'Efectivo', type: 'efectivo', balance: 0.0, color: '#4E8EA2', icon: 'cash-outline', is_active: true },
];

// Gastos Fijos Iniciales Vacíos
const INITIAL_FIXED_EXPENSES: FixedExpense[] = [];

// Presupuestos Mensuales Iniciales Vacíos
const INITIAL_BUDGETS: Budget[] = [];

// Metas de Ahorro Familiares Iniciales Vacías
const INITIAL_SAVING_GOALS: SavingGoal[] = [];

// Transacciones Iniciales Vacías (Balance $0.00)
const INITIAL_TRANSACTIONS: Transaction[] = [];

interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  fixedExpenses: FixedExpense[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  monthlySnapshots: MonthlySnapshot[];
  isLoading: boolean;

  // Acciones de Transacciones
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;
  restoreTransaction: (tx: Transaction) => void;

  // Acciones de Cuentas
  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateAccountBalance: (id: string, newBalance: number) => void;
  transferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number,
    userName: FamilyMemberName,
    note?: string
  ) => void;

  // Acciones de Categorías
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Acciones de Gastos Fijos
  addFixedExpense: (fix: Omit<FixedExpense, 'id'>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;
  markFixedExpenseStatus: (
    id: string,
    status: FixedExpenseStatus,
    autoLogExpense?: boolean,
    memberName?: FamilyMemberName
  ) => void;

  // Acciones de Presupuestos
  setBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Acciones de Metas
  addSavingGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  updateSavingGoal: (id: string, updates: Partial<SavingGoal>) => void;
  deleteSavingGoal: (id: string) => void;
  moveSavingGoal: (id: string, direction: 'up' | 'down') => void;
  depositToGoal: (
    goalId: string,
    amount: number,
    memberName: FamilyMemberName,
    accountId?: string
  ) => void;

  // Cierre Mensual
  closeMonth: (month: number, year: number, closedByName: string) => MonthlySnapshot;

  // Carga y Sincronización
  loadLocalData: () => Promise<void>;
  saveLocalData: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  subscribeToRealtime: () => () => void;
  syncStatus: SyncStatus;
}

// Auxiliares de reconciliación contable y balances exactos
const adjustAccountBalance = (
  accountsList: Account[],
  accountId: string | undefined,
  delta: number
): Account[] => {
  if (!accountId || delta === 0) return accountsList;
  const idx = accountsList.findIndex((a) => a.id === accountId);
  if (idx === -1) return accountsList;
  const copy = [...accountsList];
  copy[idx] = {
    ...copy[idx],
    balance: roundCurrency(copy[idx].balance + delta),
  };
  return copy;
};

const applyTransactionToAccounts = (
  accountsList: Account[],
  tx: Pick<Transaction, 'type' | 'amount' | 'account_id' | 'destination_account_id'>
): Account[] => {
  let updated = accountsList;
  if (tx.type === 'transfer') {
    updated = adjustAccountBalance(updated, tx.account_id, -tx.amount);
    updated = adjustAccountBalance(updated, tx.destination_account_id, +tx.amount);
  } else if (tx.type === 'income') {
    updated = adjustAccountBalance(updated, tx.account_id, +tx.amount);
  } else if (tx.type === 'expense') {
    updated = adjustAccountBalance(updated, tx.account_id, -tx.amount);
  }
  return updated;
};

const revertTransactionFromAccounts = (
  accountsList: Account[],
  tx: Pick<Transaction, 'type' | 'amount' | 'account_id' | 'destination_account_id'>
): Account[] => {
  let updated = accountsList;
  if (tx.type === 'transfer') {
    updated = adjustAccountBalance(updated, tx.account_id, +tx.amount);
    updated = adjustAccountBalance(updated, tx.destination_account_id, -tx.amount);
  } else if (tx.type === 'income') {
    updated = adjustAccountBalance(updated, tx.account_id, -tx.amount);
  } else if (tx.type === 'expense') {
    updated = adjustAccountBalance(updated, tx.account_id, +tx.amount);
  }
  return updated;
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: INITIAL_TRANSACTIONS,
  categories: INITIAL_CATEGORIES,
  accounts: INITIAL_ACCOUNTS,
  fixedExpenses: INITIAL_FIXED_EXPENSES,
  budgets: INITIAL_BUDGETS,
  savingGoals: INITIAL_SAVING_GOALS,
  monthlySnapshots: [],
  isLoading: false,
  syncStatus: 'disconnected',

  addTransaction: (txData) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    const currentAccounts = applyTransactionToAccounts(get().accounts, newTx);

    set((state) => ({
      transactions: [newTx, ...state.transactions],
      accounts: currentAccounts,
    }));

    get().saveLocalData();

    // Sincronización inmediata en tiempo real para ambos iPhones
    broadcastMutation('ADD', 'transactions', newTx);
    if (txData.account_id || txData.destination_account_id) {
      broadcastMutation('SET', 'accounts', currentAccounts);
    }

    // Sincronización en la nube si Supabase está conectado
    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').insert([newTx]).then(() => {}, () => {});
    }
  },

  updateTransaction: (id, updates) => {
    const oldTx = get().transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = { ...oldTx, ...updates };

    const hasBalanceChange =
      oldTx.amount !== newTx.amount ||
      oldTx.type !== newTx.type ||
      oldTx.account_id !== newTx.account_id ||
      oldTx.destination_account_id !== newTx.destination_account_id;

    let updatedAccounts = get().accounts;
    if (hasBalanceChange) {
      // 1. Revertir impacto anterior
      updatedAccounts = revertTransactionFromAccounts(updatedAccounts, oldTx);
      // 2. Aplicar nuevo impacto
      updatedAccounts = applyTransactionToAccounts(updatedAccounts, newTx);
    }

    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? newTx : t)),
      accounts: updatedAccounts,
    }));
    get().saveLocalData();
    broadcastMutation('UPDATE', 'transactions', newTx);
    if (hasBalanceChange) {
      broadcastMutation('SET', 'accounts', updatedAccounts);
    }

    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').update(updates).eq('id', id).then(() => {}, () => {});
    }
  },

  deleteTransaction: (id) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx) return;

    const updatedAccounts = revertTransactionFromAccounts(get().accounts, tx);

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      accounts: updatedAccounts,
    }));
    get().saveLocalData();

    broadcastMutation('DELETE', 'transactions', { id });
    if (tx.account_id || tx.destination_account_id) {
      broadcastMutation('SET', 'accounts', updatedAccounts);
    }

    if (isSupabaseConfigured() && supabase) {
      supabase.from('transactions').delete().eq('id', id).then(() => {}, () => {});
    }
  },

  restoreTransaction: (tx) => {
    const updatedAccounts = applyTransactionToAccounts(get().accounts, tx);

    set((state) => ({
      transactions: [tx, ...state.transactions.filter((t) => t.id !== tx.id)],
      accounts: updatedAccounts,
    }));
    get().saveLocalData();

    broadcastMutation('ADD', 'transactions', tx);
    if (tx.account_id || tx.destination_account_id) {
      broadcastMutation('SET', 'accounts', updatedAccounts);
    }
  },

  duplicateTransaction: (id) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;

    const duplicated: Transaction = {
      ...original,
      id: `tx-${Date.now()}`,
      description: `${original.description || ''} (Copia)`,
      date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      transactions: [duplicated, ...state.transactions],
    }));
    get().saveLocalData();
    broadcastMutation('ADD', 'transactions', duplicated);
  },

  addAccount: (accData) => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
    };
    const updated = [...get().accounts, newAcc];
    set({ accounts: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'accounts', updated);
  },

  updateAccount: (id, updates) => {
    const updated = get().accounts.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ accounts: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'accounts', updated);
  },

  deleteAccount: (id) => {
    const updated = get().accounts.filter((a) => a.id !== id);
    set({ accounts: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'accounts', updated);
  },

  updateAccountBalance: (id, newBalance) => {
    const updated = get().accounts.map((a) => (a.id === id ? { ...a, balance: newBalance } : a));
    set({ accounts: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'accounts', updated);
  },

  transferBetweenAccounts: (fromId, toId, amount, userName, note) => {
    if (amount <= 0 || fromId === toId) return;

    const roundedAmount = roundCurrency(amount);
    const updatedAccounts = get().accounts.map((a) => {
      if (a.id === fromId) return { ...a, balance: roundCurrency(a.balance - roundedAmount) };
      if (a.id === toId) return { ...a, balance: roundCurrency(a.balance + roundedAmount) };
      return a;
    });

    const tx: Transaction = {
      id: `tx-trans-${Date.now()}`,
      household_id: 'hh-joel-kat-01',
      user_name: userName,
      type: 'transfer',
      amount: roundedAmount,
      account_id: fromId,
      destination_account_id: toId,
      date: new Date().toISOString().slice(0, 10),
      description: note || 'Transferencia entre cuentas familiares',
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      accounts: updatedAccounts,
      transactions: [tx, ...state.transactions],
    }));

    get().saveLocalData();
    broadcastMutation('ADD', 'transactions', tx);
    broadcastMutation('SET', 'accounts', updatedAccounts);
  },

  addCategory: (catData) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    set((state) => ({
      categories: [...state.categories, newCat],
    }));
    get().saveLocalData();
  },

  updateCategory: (id, updates) => {
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    get().saveLocalData();
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
    get().saveLocalData();
  },

  addFixedExpense: (fixData) => {
    const newFix: FixedExpense = {
      ...fixData,
      id: `fix-${Date.now()}`,
    };
    const updated = [...get().fixedExpenses, newFix];
    set({ fixedExpenses: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'fixedExpenses', updated);
  },

  updateFixedExpense: (id, updates) => {
    const updated = get().fixedExpenses.map((f) => (f.id === id ? { ...f, ...updates } : f));
    set({ fixedExpenses: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'fixedExpenses', updated);
  },

  deleteFixedExpense: (id) => {
    const updated = get().fixedExpenses.filter((f) => f.id !== id);
    set({ fixedExpenses: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'fixedExpenses', updated);
  },

  markFixedExpenseStatus: (id, status, autoLogExpense = true, memberName = 'Joel') => {
    const expense = get().fixedExpenses.find((f) => f.id === id);
    if (!expense) return;

    const updatedFixed = get().fixedExpenses.map((f) =>
      f.id === id
        ? {
            ...f,
            status,
            last_paid_at: status === 'paid' ? new Date().toISOString().slice(0, 10) : f.last_paid_at,
          }
        : f
    );

    set({ fixedExpenses: updatedFixed });

    if (status === 'paid' && autoLogExpense) {
      get().addTransaction({
        household_id: expense.household_id,
        user_name: memberName,
        type: 'expense',
        amount: roundCurrency(expense.amount),
        category_id: expense.category_id,
        account_id: expense.account_id,
        date: new Date().toISOString().slice(0, 10),
        description: `Pago fijo: ${expense.name}`,
        payment_method: 'Gasto Fijo',
        is_recurring: true,
      });
    }

    get().saveLocalData();
    broadcastMutation('SET', 'fixedExpenses', updatedFixed);
  },

  setBudget: (bData) => {
    const existingIndex = get().budgets.findIndex(
      (b) => b.category_id === bData.category_id && b.month === bData.month && b.year === bData.year
    );

    let updated: Budget[];
    if (existingIndex !== -1) {
      updated = [...get().budgets];
      updated[existingIndex] = { ...updated[existingIndex], allocated_amount: bData.allocated_amount };
    } else {
      updated = [...get().budgets, { ...bData, id: `bg-${Date.now()}` }];
    }

    set({ budgets: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'budgets', updated);
  },

  updateBudget: (id, updates) => {
    const updated = get().budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ budgets: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'budgets', updated);
  },

  deleteBudget: (id) => {
    const updated = get().budgets.filter((b) => b.id !== id);
    set({ budgets: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'budgets', updated);
  },

  addSavingGoal: (goalData) => {
    const currentGoals = get().savingGoals;
    const newGoal: SavingGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      priority: goalData.priority || currentGoals.length + 1,
    };
    const updated = [...currentGoals, newGoal];
    set({ savingGoals: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'savingGoals', updated);
  },

  updateSavingGoal: (id, updates) => {
    const updated = get().savingGoals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ savingGoals: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'savingGoals', updated);
  },

  deleteSavingGoal: (id) => {
    const filtered = get().savingGoals.filter((g) => g.id !== id);
    const updated = filtered.map((g, idx) => ({ ...g, priority: idx + 1 }));
    set({ savingGoals: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'savingGoals', updated);
  },

  moveSavingGoal: (id, direction) => {
    const goals = [...get().savingGoals];
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= goals.length) return;

    // Intercambiar posiciones
    const temp = goals[index];
    goals[index] = goals[targetIndex];
    goals[targetIndex] = temp;

    // Normalizar prioridades #1, #2, #3...
    const updated = goals.map((g, idx) => ({ ...g, priority: idx + 1 }));

    set({ savingGoals: updated });
    get().saveLocalData();
    broadcastMutation('SET', 'savingGoals', updated);
  },

  depositToGoal: (goalId, amount, memberName, accountId) => {
    if (amount <= 0) return;
    const roundedAmount = roundCurrency(amount);

    const updatedGoals = get().savingGoals.map((g) => {
      if (g.id === goalId) {
        const nextAmt = roundCurrency(g.current_amount + roundedAmount);
        return {
          ...g,
          current_amount: nextAmt,
          is_completed: nextAmt >= g.target_amount,
        };
      }
      return g;
    });

    const targetGoal = get().savingGoals.find((g) => g.id === goalId);

    get().addTransaction({
      household_id: 'hh-joel-kat-01',
      user_name: memberName,
      type: 'expense',
      amount: roundedAmount,
      account_id: accountId,
      date: new Date().toISOString().slice(0, 10),
      description: `Aporte a Meta: ${targetGoal?.name || 'Ahorro'}`,
      payment_method: 'Ahorro',
    });

    set({ savingGoals: updatedGoals });
    get().saveLocalData();
    broadcastMutation('SET', 'savingGoals', updatedGoals);
  },

  closeMonth: (month, year, closedByName) => {
    const totals = calculateMonthlyTotals(get().transactions, month, year);
    const catMap = get().categories.reduce((acc, c) => {
      acc[c.id] = { name: c.name, color: c.color, icon: c.icon };
      return acc;
    }, {} as Record<string, { name: string; color: string; icon: string }>);

    const breakdown = calculateCategoryBreakdown(get().transactions, 'expense', catMap);

    const snapshot: MonthlySnapshot = {
      id: `snap-${year}-${month}`,
      household_id: 'hh-joel-kat-01',
      month,
      year,
      total_income: totals.totalIncome,
      total_expenses: totals.totalExpenses,
      net_savings: totals.netBalance,
      savings_rate: totals.savingsRate,
      top_categories_json: breakdown.slice(0, 5).map((b) => ({
        category: b.name,
        amount: b.amount,
        percentage: b.percentage,
      })),
      closed_at: new Date().toISOString(),
      closed_by_name: closedByName,
    };

    set((state) => ({
      monthlySnapshots: [snapshot, ...state.monthlySnapshots.filter((s) => !(s.month === month && s.year === year))],
    }));

    get().saveLocalData();
    return snapshot;
  },

  loadLocalData: async () => {
    try {
      const [storedTx, storedCat, storedAcc, storedFix, storedBg, storedGoals, storedSnaps] =
        await Promise.all([
          AsyncStorage.getItem('@joekat_transactions'),
          AsyncStorage.getItem('@joekat_categories'),
          AsyncStorage.getItem('@joekat_accounts'),
          AsyncStorage.getItem('@joekat_fixed_expenses'),
          AsyncStorage.getItem('@joekat_budgets'),
          AsyncStorage.getItem('@joekat_saving_goals'),
          AsyncStorage.getItem('@joekat_snapshots'),
        ]);

      set({
        transactions: storedTx ? JSON.parse(storedTx) : INITIAL_TRANSACTIONS,
        categories: storedCat ? JSON.parse(storedCat) : INITIAL_CATEGORIES,
        accounts: storedAcc ? JSON.parse(storedAcc) : INITIAL_ACCOUNTS,
        fixedExpenses: storedFix ? JSON.parse(storedFix) : INITIAL_FIXED_EXPENSES,
        budgets: storedBg ? JSON.parse(storedBg) : INITIAL_BUDGETS,
        savingGoals: storedGoals ? JSON.parse(storedGoals) : INITIAL_SAVING_GOALS,
        monthlySnapshots: storedSnaps ? JSON.parse(storedSnaps) : [],
      });

      // Consultar y sincronizar con la base de datos central en tiempo real
      fetchRemoteSyncState().then((remote) => {
        if (remote) {
          const currentLocalTx = get().transactions;
          const remoteTxCount = Array.isArray(remote.transactions) ? remote.transactions.length : 0;

          // AUTO-HEALING / DISASTER RECOVERY:
          // Si el servidor en la nube se reinició o está vacío pero el iPhone tiene datos reales:
          if (remoteTxCount === 0 && currentLocalTx && currentLocalTx.length > 0) {
            console.log('[JOEKAT-SYNC] Auto-Healing: Restaurando estado de la nube desde almacenamiento de iPhone...');
            broadcastMutation('SET', 'ALL' as any, {
              transactions: get().transactions,
              accounts: get().accounts,
              fixedExpenses: get().fixedExpenses,
              budgets: get().budgets,
              savingGoals: get().savingGoals,
              monthlySnapshots: get().monthlySnapshots,
            });
            return;
          }

          set({
            transactions: remote.transactions && remote.transactions.length > 0 ? remote.transactions : get().transactions,
            accounts: remote.accounts && remote.accounts.length > 0 ? remote.accounts : get().accounts,
            fixedExpenses: remote.fixedExpenses && remote.fixedExpenses.length > 0 ? remote.fixedExpenses : get().fixedExpenses,
            budgets: remote.budgets && remote.budgets.length > 0 ? remote.budgets : get().budgets,
            savingGoals: remote.savingGoals && remote.savingGoals.length > 0 ? remote.savingGoals : get().savingGoals,
            monthlySnapshots: remote.monthlySnapshots && remote.monthlySnapshots.length > 0 ? remote.monthlySnapshots : get().monthlySnapshots,
          });
          get().saveLocalData();
        }
      }).catch(() => {});
    } catch {
      // Uso de datos predeterminados
    }
  },

  saveLocalData: async () => {
    try {
      const { transactions, categories, accounts, fixedExpenses, budgets, savingGoals, monthlySnapshots } = get();
      await Promise.all([
        AsyncStorage.setItem('@joekat_transactions', JSON.stringify(transactions)),
        AsyncStorage.setItem('@joekat_categories', JSON.stringify(categories)),
        AsyncStorage.setItem('@joekat_accounts', JSON.stringify(accounts)),
        AsyncStorage.setItem('@joekat_fixed_expenses', JSON.stringify(fixedExpenses)),
        AsyncStorage.setItem('@joekat_budgets', JSON.stringify(budgets)),
        AsyncStorage.setItem('@joekat_saving_goals', JSON.stringify(savingGoals)),
        AsyncStorage.setItem('@joekat_snapshots', JSON.stringify(monthlySnapshots)),
      ]);
    } catch {
      // Error silencioso de caché
    }
  },

  syncWithSupabase: async () => {
    try {
      // Intentar refresco desde el servidor de sincronización en tiempo real
      const remote = await fetchRemoteSyncState();
      if (remote) {
        const currentLocalTx = get().transactions;
        const remoteTxCount = Array.isArray(remote.transactions) ? remote.transactions.length : 0;

        if (remoteTxCount === 0 && currentLocalTx && currentLocalTx.length > 0) {
          broadcastMutation('SET', 'ALL' as any, {
            transactions: get().transactions,
            accounts: get().accounts,
            fixedExpenses: get().fixedExpenses,
            budgets: get().budgets,
            savingGoals: get().savingGoals,
            monthlySnapshots: get().monthlySnapshots,
          });
          return;
        }

        set({
          transactions: remote.transactions && remote.transactions.length > 0 ? remote.transactions : get().transactions,
          accounts: remote.accounts && remote.accounts.length > 0 ? remote.accounts : get().accounts,
          fixedExpenses: remote.fixedExpenses && remote.fixedExpenses.length > 0 ? remote.fixedExpenses : get().fixedExpenses,
          budgets: remote.budgets && remote.budgets.length > 0 ? remote.budgets : get().budgets,
          savingGoals: remote.savingGoals && remote.savingGoals.length > 0 ? remote.savingGoals : get().savingGoals,
        });
        get().saveLocalData();
      }
    } catch {}

    if (!isSupabaseConfigured() || !supabase) return;
    set({ isLoading: true });
    try {
      const { data: remoteTx } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (remoteTx && remoteTx.length > 0) {
        set({ transactions: remoteTx as Transaction[] });
      }

      const { data: remoteAcc } = await supabase.from('accounts').select('*');
      if (remoteAcc && remoteAcc.length > 0) {
        set({ accounts: remoteAcc as Account[] });
      }

      set({ isLoading: false });
      get().saveLocalData();
    } catch {
      set({ isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    // 1. Suscripción a cambios de estado de conexión (en vivo / reconectando)
    const unsubStatus = subscribeSyncStatus((status) => {
      set({ syncStatus: status });
    });

    // 2. Conexión continua SSE y Delta Polling para sincronización instantánea entre iPhones
    const unsubSSE = startRealtimeSyncConnection((payload) => {
      const { action, entity, data } = payload;
      if (!entity || !data) return;

      if (entity === 'ALL' && data) {
        set({
          transactions: data.transactions || get().transactions,
          accounts: data.accounts || get().accounts,
          fixedExpenses: data.fixedExpenses || get().fixedExpenses,
          budgets: data.budgets || get().budgets,
          savingGoals: data.savingGoals || get().savingGoals,
          monthlySnapshots: data.monthlySnapshots || get().monthlySnapshots,
        });
        get().saveLocalData();
        return;
      }

      if (entity === 'transactions') {
        const items: Transaction[] = Array.isArray(data) ? data : [data];
        if (action === 'ADD') {
          set((state) => {
            const filtered = items.filter((item) => !state.transactions.some((t) => t.id === item.id));
            return { transactions: [...filtered, ...state.transactions] };
          });
        } else if (action === 'UPDATE') {
          set((state) => ({
            transactions: state.transactions.map((t) => {
              const match = items.find((x) => x.id === t.id);
              return match ? { ...t, ...match } : t;
            }),
          }));
        } else if (action === 'DELETE') {
          const idToDelete = typeof data === 'string' ? data : data.id;
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== idToDelete),
          }));
        } else if (action === 'SET') {
          set({ transactions: items });
        }
      } else if (entity === 'accounts') {
        if (action === 'SET' || Array.isArray(data)) {
          set({ accounts: Array.isArray(data) ? data : [data] });
        } else if (action === 'UPDATE') {
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === data.id ? { ...a, ...data } : a)),
          }));
        }
      } else if (entity === 'fixedExpenses') {
        if (action === 'SET' || Array.isArray(data)) {
          set({ fixedExpenses: Array.isArray(data) ? data : [data] });
        } else if (action === 'UPDATE') {
          set((state) => ({
            fixedExpenses: state.fixedExpenses.map((f) => (f.id === data.id ? { ...f, ...data } : f)),
          }));
        } else if (action === 'ADD') {
          set((state) => ({ fixedExpenses: [...state.fixedExpenses, data] }));
        }
      } else if (entity === 'budgets') {
        if (action === 'SET' || Array.isArray(data)) {
          set({ budgets: Array.isArray(data) ? data : [data] });
        }
      } else if (entity === 'savingGoals') {
        if (action === 'SET' || Array.isArray(data)) {
          set({ savingGoals: Array.isArray(data) ? data : [data] });
        } else if (action === 'UPDATE') {
          set((state) => ({
            savingGoals: state.savingGoals.map((g) => (g.id === data.id ? { ...g, ...data } : g)),
          }));
        } else if (action === 'ADD') {
          set((state) => ({ savingGoals: [...state.savingGoals, data] }));
        }
      }

      get().saveLocalData();
    });

    // 3. Fallback de Supabase si configurado
    let unsubSupabase = () => {};
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:transactions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions' },
          (payload) => {
            const newTx = payload.new as Transaction;
            const current = get().transactions;
            if (!current.some((t) => t.id === newTx.id)) {
              set({ transactions: [newTx, ...current] });
              get().saveLocalData();
            }
          }
        )
        .subscribe();
      unsubSupabase = () => {
        supabase?.removeChannel(channel);
      };
    }

    return () => {
      unsubStatus();
      unsubSSE();
      unsubSupabase();
    };
  },
}));
