// =====================================================================
// MÓDULO JOEKAT AI - ASISTENTE FINANCIERO INTELIGENTE Y VERÍDICO
// Consulta estrictamente datos reales calculados de la base de datos
// =====================================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Radius } from '../../theme/designTokens';
import { formatCurrency } from '../../utils/currency';
import { calculateMonthlyTotals, getMonthComparisonText } from '../../utils/calculations';

export const JoekatAIAssistant: React.FC = () => {
  const { transactions, categories, savingGoals, fixedExpenses, budgets } = useFinanceStore();
  const { isDarkMode } = useThemeStore();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const currentTotals = calculateMonthlyTotals(transactions, currentMonth, currentYear);
  const prevTotals = calculateMonthlyTotals(transactions, prevMonth, prevYear);
  const comparison = getMonthComparisonText(currentTotals.totalExpenses, prevTotals.totalExpenses);

  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, any>);

  const suggestedQuestions = [
    '¿Cuánto gastamos este mes?',
    '¿En qué gastamos más?',
    '¿Cuánto gastó Joel?',
    '¿Cuánto gastó Kath?',
    'Compara este mes con el anterior',
    '¿Cuánto podemos ahorrar este mes?',
    '¿Cuánto gastamos en supermercado?',
    '¿Cuánto falta para nuestras metas?',
  ];

  const handleAsk = (questionToAsk?: string) => {
    const q = (questionToAsk || query).trim().toLowerCase();
    if (!q) return;

    setIsThinking(true);
    setTimeout(() => {
      let answer = '';

      // 1. ¿Cuánto gastamos este mes?
      if (q.includes('cuanto gastamos') || q.includes('cuánto gastamos') || q.includes('total gastos')) {
        answer = `En lo que va de mes han registrado un total de gastos de ${formatCurrency(currentTotals.totalExpenses, 'DOP')} frente a unos ingresos de ${formatCurrency(currentTotals.totalIncome, 'DOP')}. Su balance disponible actual es de ${formatCurrency(currentTotals.netBalance, 'DOP')}.`;
      }
      // 2. ¿En qué gastamos más?
      else if (q.includes('mas') || q.includes('más') || q.includes('mayor gasto') || q.includes('categoria principal')) {
        const monthExpenses = transactions.filter((t) => {
          if (t.type !== 'expense' || !t.date) return false;
          const p = t.date.split('-');
          return parseInt(p[0], 10) === currentYear && parseInt(p[1], 10) === currentMonth;
        });

        const byCat: Record<string, number> = {};
        for (const t of monthExpenses) {
          const catName = categoriesMap[t.category_id || '']?.name || 'Varios';
          byCat[catName] = (byCat[catName] || 0) + t.amount;
        }

        const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const top = sorted[0];
          const pct = currentTotals.totalExpenses > 0 ? Math.round((top[1] / currentTotals.totalExpenses) * 100) : 0;
          answer = `El mayor gasto de este mes corresponde a "${top[0]}" con un total acumulado de ${formatCurrency(top[1], 'DOP')}, lo que representa el ${pct}% de todos los gastos del hogar.`;
        } else {
          answer = 'Aún no hay gastos categorizados en este periodo para determinar la mayor categoría.';
        }
      }
      // 3. ¿Cuánto gastó Joel?
      else if (q.includes('joel')) {
        const joelExpenses = transactions.filter((t) => {
          if (t.type !== 'expense' || !t.date) return false;
          const p = t.date.split('-');
          const isMonth = parseInt(p[0], 10) === currentYear && parseInt(p[1], 10) === currentMonth;
          return isMonth && (t.user_name === 'Joel' || t.owner === 'joel');
        }).reduce((sum, t) => sum + t.amount, 0);

        answer = `Joel ha registrado este mes ${formatCurrency(joelExpenses, 'DOP')} en gastos personales y asignados.`;
      }
      // 4. ¿Cuánto gastó Kath?
      else if (q.includes('kath') || q.includes('kat')) {
        const kathExpenses = transactions.filter((t) => {
          if (t.type !== 'expense' || !t.date) return false;
          const p = t.date.split('-');
          const isMonth = parseInt(p[0], 10) === currentYear && parseInt(p[1], 10) === currentMonth;
          return isMonth && (t.user_name === 'Kath' || t.user_name === 'Kat' || t.owner === 'kath');
        }).reduce((sum, t) => sum + t.amount, 0);

        answer = `Kath ha registrado este mes ${formatCurrency(kathExpenses, 'DOP')} en gastos personales y asignados.`;
      }
      // 5. Compara este mes con el anterior
      else if (q.includes('compara') || q.includes('mes anterior') || q.includes('evolucion')) {
        answer = `${comparison.text} El mes anterior tuvieron ${formatCurrency(prevTotals.totalExpenses, 'DOP')} en gastos, mientras que este mes llevan ${formatCurrency(currentTotals.totalExpenses, 'DOP')}.`;
      }
      // 6. ¿Cuánto podemos ahorrar este mes?
      else if (q.includes('ahorrar') || q.includes('tasa de ahorro') || q.includes('ahorro')) {
        const fixedTotal = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
        const estimatedFree = Math.max(0, currentTotals.netBalance - fixedTotal);
        answer = `Actualmente tienen un balance neto disponible de ${formatCurrency(currentTotals.netBalance, 'DOP')} con una tasa de ahorro del ${currentTotals.savingsRate}%. Tomando en cuenta los compromisos fijos pendientes (${formatCurrency(fixedTotal, 'DOP')}), disponen de un estimado de ${formatCurrency(estimatedFree, 'DOP')} que pueden destinar a ahorro o inversión.`;
      }
      // 7. ¿Cuánto gastamos en [categoría]? (ej. supermercado, comida, combustible)
      else if (q.includes('supermercado') || q.includes('comida') || q.includes('combustible') || q.includes('vehiculo')) {
        const term = q.includes('supermercado') ? 'supermercado' : q.includes('comida') ? 'comida' : q.includes('combustible') ? 'combustible' : 'vehículo';
        const matchedCat = categories.find((c) => c.name.toLowerCase().includes(term));
        if (matchedCat) {
          const sum = transactions
            .filter((t) => t.category_id === matchedCat.id && t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
          answer = `Han gastado un total acumulado de ${formatCurrency(sum, 'DOP')} en la categoría "${matchedCat.name}".`;
        } else {
          answer = `No se encontró una categoría específica con el nombre solicitado.`;
        }
      }
      // 8. ¿Cuánto falta para metas?
      else if (q.includes('meta') || q.includes('vacaciones') || q.includes('vehiculo') || q.includes('colchon')) {
        if (savingGoals.length > 0) {
          const topGoal = savingGoals[0];
          const remaining = Math.max(0, topGoal.target_amount - topGoal.current_amount);
          const pct = Math.min(100, Math.round((topGoal.current_amount / topGoal.target_amount) * 100));
          answer = `Para su meta prioritaria #${topGoal.priority || 1} "${topGoal.name}" llevan ahorrados ${formatCurrency(topGoal.current_amount, 'DOP')} de ${formatCurrency(topGoal.target_amount, 'DOP')} (${pct}% completado). Faltan exactamente ${formatCurrency(remaining, 'DOP')}.`;
        } else {
          answer = 'Aún no han creado ninguna meta de ahorro familiar en el módulo de Metas.';
        }
      }
      // Respuesta general informada
      else {
        answer = `Consultando sus registros: En este periodo han tenido ${formatCurrency(currentTotals.totalIncome, 'DOP')} de ingresos y ${formatCurrency(currentTotals.totalExpenses, 'DOP')} de gastos. Tienen ${transactions.length} movimientos registrados en la base de datos compartida.`;
      }

      setResponse(answer);
      setIsThinking(false);
    }, 400);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        !isDarkMode && styles.cardContainerLight,
        Platform.OS === 'web' ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any) : null,
      ]}
    >
      {/* Header con insignia AI */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={16} color={Colors.secondaryGreen} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.title, !isDarkMode && { color: '#071827' }]}>JOEKAT AI</Text>
          <Text style={[styles.subtitle, !isDarkMode && { color: '#64748B' }]}>Asistente financiero basado exclusivamente en sus datos reales</Text>
        </View>
      </View>

      {/* Input de consulta */}
      <View style={[styles.inputContainer, !isDarkMode && styles.inputContainerLight]}>
        <TextInput
          style={[styles.textInput, !isDarkMode && { color: '#071827' }]}
          placeholder="Pregúntale a JOEKAT sobre tus finanzas..."
          placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.4)'}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAsk()}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleAsk()}
          style={styles.askBtn}
        >
          <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chips con preguntas sugeridas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {suggestedQuestions.map((sq, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.8}
            onPress={() => {
              setQuery(sq);
              handleAsk(sq);
            }}
            style={[styles.chip, !isDarkMode && styles.chipLight]}
          >
            <Text style={[styles.chipText, !isDarkMode && { color: '#334155' }]}>{sq}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Respuesta de la IA */}
      {isThinking ? (
        <View style={[styles.responseCard, !isDarkMode && styles.responseCardLight]}>
          <Text style={styles.thinkingText}>Analizando base de datos en tiempo real...</Text>
        </View>
      ) : response ? (
        <View style={[styles.responseCard, !isDarkMode && styles.responseCardLight]}>
          <View style={styles.responseHeader}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.secondaryGreen} style={{ marginRight: 6 }} />
            <Text style={styles.responseAuthor}>Respuesta JOEKAT:</Text>
          </View>
          <Text style={[styles.responseText, !isDarkMode && { color: '#071827' }]}>{response}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.ivoryTranslucent,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ivoryWhite,
    paddingVertical: 6,
  },
  askBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    fontSize: 11,
    color: Colors.ivoryTranslucent,
    fontWeight: '600',
  },
  responseCard: {
    backgroundColor: 'rgba(16, 42, 67, 0.75)',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  responseAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thinkingText: {
    fontSize: 12,
    color: Colors.secondaryGreen,
    fontStyle: 'italic',
  },
  responseText: {
    fontSize: 13,
    color: Colors.ivoryWhite,
    lineHeight: 19,
    fontWeight: '500',
  },
  cardContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainerLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  chipLight: {
    backgroundColor: '#F1F5F9',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  responseCardLight: {
    backgroundColor: '#F0FDFA',
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
});
