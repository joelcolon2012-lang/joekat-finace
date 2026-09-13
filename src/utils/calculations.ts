import { Transaction } from '../types';
import { roundCurrency } from './currency';

export interface MonthlyTotals {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlySavings: number;
  savingsRate: number; // porcentaje 0-100
}

export const calculateMonthlyTotals = (
  transactions: Transaction[],
  targetMonth?: number, // 1-12
  targetYear?: number
): MonthlyTotals => {
  const now = new Date();
  const m = targetMonth !== undefined ? targetMonth : now.getMonth() + 1;
  const y = targetYear !== undefined ? targetYear : now.getFullYear();

  const filtered = transactions.filter((t) => {
    if (!t.date) return false;
    const parts = t.date.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      return year === y && month === m;
    }
    return false;
  });

  let rawIncome = 0;
  let rawExpenses = 0;

  for (const t of filtered) {
    if (t.type === 'income') {
      rawIncome += t.amount;
    } else if (t.type === 'expense') {
      rawExpenses += t.amount;
    }
  }

  const totalIncome = roundCurrency(rawIncome);
  const totalExpenses = roundCurrency(rawExpenses);
  const netBalance = roundCurrency(totalIncome - totalExpenses);
  const monthlySavings = netBalance > 0 ? netBalance : 0;
  const savingsRate =
    totalIncome > 0
      ? Math.min(100, Math.max(0, Math.round((netBalance / totalIncome) * 100)))
      : 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    monthlySavings,
    savingsRate,
  };
};

export const getMonthComparisonText = (
  currentExpenses: number,
  previousExpenses: number
): { text: string; isPositive: boolean; percentage: number } => {
  if (previousExpenses === 0 && currentExpenses === 0) {
    return {
      text: 'Aún no hay gastos suficientes para comparar periodos.',
      isPositive: true,
      percentage: 0,
    };
  }

  if (previousExpenses === 0) {
    return {
      text: 'Primer periodo con gastos registrados.',
      isPositive: true,
      percentage: 100,
    };
  }

  const diff = currentExpenses - previousExpenses;
  const percentage = Math.round(Math.abs(diff / previousExpenses) * 100);

  if (diff < 0) {
    return {
      text: `Este mes gastaron un ${percentage}% menos que el mes anterior.`,
      isPositive: true, // Gastar menos es positivo para el ahorro familiar
      percentage,
    };
  } else if (diff > 0) {
    return {
      text: `Este mes los gastos aumentaron un ${percentage}%.`,
      isPositive: false,
      percentage,
    };
  } else {
    return {
      text: 'Los gastos de este mes se mantuvieron iguales al mes anterior.',
      isPositive: true,
      percentage: 0,
    };
  }
};

export const calculateCategoryBreakdown = (
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense',
  categoriesMap: Record<string, { name: string; color: string; icon: string }>
): { categoryId: string; name: string; amount: number; percentage: number; color: string; icon: string }[] => {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((acc, t) => acc + t.amount, 0);

  if (total === 0) return [];

  const map: Record<string, number> = {};
  for (const t of filtered) {
    const catId = t.category_id || 'otros';
    map[catId] = (map[catId] || 0) + t.amount;
  }

  return Object.entries(map)
    .map(([categoryId, amount]) => {
      const catInfo = categoriesMap[categoryId] || {
        name: 'Otros',
        color: '#8E9AA8',
        icon: 'tag',
      };
      const percentage = Math.round((amount / total) * 100);
      return {
        categoryId,
        name: catInfo.name,
        amount,
        percentage,
        color: catInfo.color,
        icon: catInfo.icon,
      };
    })
    .sort((a, b) => b.amount - a.amount);
};
