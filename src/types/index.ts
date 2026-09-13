// Tipos globales y definiciones de datos para JOEKAT FINACE

export type UserRole = 'owner' | 'member';
export type FamilyMemberName = 'Joel' | 'Kath' | 'Kat' | string;

export interface UserProfile {
  id: string;
  email: string;
  name: FamilyMemberName;
  avatar_url?: string;
  preferred_currency: string; // 'DOP', 'USD', etc.
  household_id?: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export type AccountType =
  | 'efectivo'
  | 'conjunta'
  | 'joel'
  | 'kath'
  | 'kat'
  | 'tarjeta_credito'
  | 'ahorro'
  | 'banco'
  | 'otro';

export interface Account {
  id: string;
  household_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon?: string;
  is_active: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'savings' | 'debt';
export type TransactionOwner = 'joel' | 'kath' | 'shared';
export type RecurrenceFrequency = 'semanal' | 'quincenal' | 'mensual' | 'anual';

export interface Category {
  id: string;
  household_id?: string;
  name: string;
  type: 'income' | 'expense' | 'savings' | 'debt';
  icon: string;
  color: string;
  is_system?: boolean;
}

export interface Transaction {
  id: string;
  household_id: string;
  user_id?: string;
  user_name: FamilyMemberName;
  owner?: TransactionOwner;
  account_id?: string;
  destination_account_id?: string; // Para transferencias
  category_id?: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
  receipt_url?: string;
  payment_method?: string;
  is_recurring?: boolean;
  frequency?: RecurrenceFrequency;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export type FixedExpenseStatus = 'paid' | 'pending' | 'upcoming';

export interface FixedExpense {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  due_day: number; // 1-31
  frequency: string;
  category_id?: string;
  account_id?: string;
  responsible?: FamilyMemberName;
  owner?: TransactionOwner;
  status: FixedExpenseStatus;
  last_paid_at?: string;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  month: number;
  year: number;
  allocated_amount: number;
}

export interface SavingGoal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  icon: string;
  color: string;
  is_completed?: boolean;
  priority?: number;
}

export interface GoalTransaction {
  id: string;
  goal_id: string;
  user_name: FamilyMemberName;
  amount: number;
  date: string;
  note?: string;
}

export interface MonthlySnapshot {
  id: string;
  household_id: string;
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  top_categories_json: { category: string; amount: number; percentage: number }[];
  closed_at: string;
  closed_by_name: string;
}

export interface FinancialHealthMetric {
  label: string;
  score: number; // 0-100
  status: 'good' | 'warning' | 'bad';
  note: string;
}

export interface FinancialHealthResult {
  score: number; // 0 - 100
  rating: 'EXCELENTE' | 'MUY BUENA' | 'BUENA' | 'REGULAR' | 'ATENCIÓN';
  summary: string;
  factors: FinancialHealthMetric[];
}
