// Motor de cálculo de Salud Financiera Familiar (0 a 100) para JOEKAT FINACE
import { FinancialHealthResult, FinancialHealthMetric } from '../types';

interface HealthInput {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number; // 0 - 100
  fixedExpensesTotal: number;
  budgetsOverLimitCount: number;
  totalBudgetsCount: number;
}

export const calculateFinancialHealth = (input: HealthInput): FinancialHealthResult => {
  const {
    totalIncome,
    totalExpenses,
    savingsRate,
    fixedExpensesTotal,
    budgetsOverLimitCount,
    totalBudgetsCount,
  } = input;

  const factors: FinancialHealthMetric[] = [];

  // Factor 1: Tasa de Ahorro (Ponderación 30 puntos)
  // Objetivo: >= 20% es excelente, 10-19% bueno, <10% bajo
  let savingsScore = 0;
  let savingsStatus: 'good' | 'warning' | 'bad' = 'good';
  let savingsNote = '';

  if (savingsRate >= 25) {
    savingsScore = 30;
    savingsStatus = 'good';
    savingsNote = `Excelente tasa de ahorro familiar (${savingsRate}%).`;
  } else if (savingsRate >= 15) {
    savingsScore = 24;
    savingsStatus = 'good';
    savingsNote = `Buena tasa de ahorro (${savingsRate}%). Muy cerca del objetivo óptimo.`;
  } else if (savingsRate >= 5) {
    savingsScore = 15;
    savingsStatus = 'warning';
    savingsNote = `Tasa de ahorro moderada (${savingsRate}%). Hay oportunidad de recortar gastos.`;
  } else {
    savingsScore = 5;
    savingsStatus = 'bad';
    savingsNote = `Tasa de ahorro baja (${savingsRate}%). Prioricen el fondo de emergencia.`;
  }

  factors.push({
    label: 'Capacidad de Ahorro',
    score: Math.round((savingsScore / 30) * 100),
    status: savingsStatus,
    note: savingsNote,
  });

  // Factor 2: Relación Ingresos vs Gastos (Ponderación 25 puntos)
  let ratioScore = 0;
  let ratioStatus: 'good' | 'warning' | 'bad' = 'good';
  let ratioNote = '';

  if (totalIncome <= 0 && totalExpenses > 0) {
    ratioScore = 5;
    ratioStatus = 'bad';
    ratioNote = 'Gastos sin ingresos registrados este periodo.';
  } else if (totalIncome <= 0 && totalExpenses <= 0) {
    ratioScore = 20;
    ratioStatus = 'good';
    ratioNote = 'Periodo sin movimientos registrados.';
  } else {
    const expenseRatio = (totalExpenses / totalIncome) * 100;
    if (expenseRatio <= 70) {
      ratioScore = 25;
      ratioStatus = 'good';
      ratioNote = `Gastan solo el ${Math.round(expenseRatio)}% de lo que ingresan. Gran margen de seguridad.`;
    } else if (expenseRatio <= 85) {
      ratioScore = 18;
      ratioStatus = 'warning';
      ratioNote = `Gastos al ${Math.round(expenseRatio)}% de los ingresos. Margen saludable pero ajustado.`;
    } else if (expenseRatio <= 100) {
      ratioScore = 10;
      ratioStatus = 'warning';
      ratioNote = `Al límite (${Math.round(expenseRatio)}% gastado). Recomendado revisar gastos superfluos.`;
    } else {
      ratioScore = 2;
      ratioStatus = 'bad';
      ratioNote = `Déficit familiar (${Math.round(expenseRatio)}% gastado). Gastando más de lo ingresado.`;
    }
  }

  factors.push({
    label: 'Relación Ingreso / Gasto',
    score: Math.round((ratioScore / 25) * 100),
    status: ratioStatus,
    note: ratioNote,
  });

  // Factor 3: Peso de los Gastos Fijos (Ponderación 25 puntos)
  // Regla 50/30/20: Gastos fijos ideales <= 50% de ingresos
  let fixedScore = 0;
  let fixedStatus: 'good' | 'warning' | 'bad' = 'good';
  let fixedNote = '';

  if (totalIncome > 0) {
    const fixedRatio = (fixedExpensesTotal / totalIncome) * 100;
    if (fixedRatio <= 40) {
      fixedScore = 25;
      fixedStatus = 'good';
      fixedNote = `Gastos fijos bien controlados (${Math.round(fixedRatio)}% de ingresos).`;
    } else if (fixedRatio <= 55) {
      fixedScore = 18;
      fixedStatus = 'good';
      fixedNote = `Compromisos fijos dentro de lo normal (${Math.round(fixedRatio)}%).`;
    } else {
      fixedScore = 8;
      fixedStatus = 'bad';
      fixedNote = `Gastos fijos elevados (${Math.round(fixedRatio)}%). Poca flexibilidad si bajan ingresos.`;
    }
  } else {
    fixedScore = 18;
    fixedNote = 'Gastos fijos estables.';
  }

  factors.push({
    label: 'Carga de Gastos Fijos',
    score: Math.round((fixedScore / 25) * 100),
    status: fixedStatus,
    note: fixedNote,
  });

  // Factor 4: Disciplina Presupuestaria (Ponderación 20 puntos)
  let budgetScore = 0;
  let budgetStatus: 'good' | 'warning' | 'bad' = 'good';
  let budgetNote = '';

  if (totalBudgetsCount === 0) {
    budgetScore = 15;
    budgetStatus = 'good';
    budgetNote = 'Sin límites excedidos.';
  } else if (budgetsOverLimitCount === 0) {
    budgetScore = 20;
    budgetStatus = 'good';
    budgetNote = 'Todos los presupuestos del mes se están cumpliendo a la perfección.';
  } else if (budgetsOverLimitCount === 1) {
    budgetScore = 12;
    budgetStatus = 'warning';
    budgetNote = 'Un presupuesto ha superado el límite fijado.';
  } else {
    budgetScore = 5;
    budgetStatus = 'bad';
    budgetNote = `${budgetsOverLimitCount} presupuestos han superado el límite.`;
  }

  factors.push({
    label: 'Cumplimiento de Presupuestos',
    score: Math.round((budgetScore / 20) * 100),
    status: budgetStatus,
    note: budgetNote,
  });

  // Puntuación Total Final
  const finalScore = Math.min(100, Math.max(0, savingsScore + ratioScore + fixedScore + budgetScore));

  let rating: FinancialHealthResult['rating'] = 'MUY BUENA';
  let summary = '';

  if (finalScore >= 88) {
    rating = 'EXCELENTE';
    summary = 'Sus finanzas familiares están en un estado óptimo con gran proyección de crecimiento.';
  } else if (finalScore >= 75) {
    rating = 'MUY BUENA';
    summary = 'Mantienen un balance sólido con excelente control y capacidad de ahorro constante.';
  } else if (finalScore >= 60) {
    rating = 'BUENA';
    summary = 'Finanzas estables, aunque pequeñas optimizaciones en gastos fijos aumentarán su ahorro.';
  } else if (finalScore >= 45) {
    rating = 'REGULAR';
    summary = 'Atención recomendada: los gastos están absorbiendo la mayor parte de sus ingresos.';
  } else {
    rating = 'ATENCIÓN';
    summary = 'Alerta financiera: se recomienda revisar inmediatamente gastos recurrentes y deudas.';
  }

  return {
    score: finalScore,
    rating,
    summary,
    factors,
  };
};
