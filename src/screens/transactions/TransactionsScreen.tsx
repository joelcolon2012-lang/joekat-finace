// Pantalla de Historial de Movimientos y Buscador Global para JOEKAT FINACE
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { Transaction, FamilyMemberName, TransactionType } from '../../types';
import { JKTransactionCard } from '../../components/common/JKTransactionCard';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { JKModal } from '../../components/common/JKModal';
import { JKButton } from '../../components/common/JKButton';
import { toast } from '../../components/common/JKToast';
import { getDateHeaderLabel } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { AddTransactionModal } from './AddTransactionModal';

export const TransactionsScreen: React.FC = () => {
  const { transactions, categories, deleteTransaction, restoreTransaction, duplicateTransaction } =
    useFinanceStore();
  const { theme, currency } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<'Todos' | 'Joel' | 'Kath'>('Todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'Todos' | 'expense' | 'income' | 'transfer'>('Todos');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('Todos');

  // Estado para el modal de acciones sobre un movimiento
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, any>);
  }, [categories]);

  // Filtrado y búsqueda inteligente con orden cronológico estricto
  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return sorted.filter((t) => {
      // Filtro de persona
      if (selectedPersonFilter === 'Kath') {
        if (t.user_name !== 'Kath' && t.user_name !== 'Kat') return false;
      } else if (selectedPersonFilter === 'Joel') {
        if (t.user_name !== 'Joel') return false;
      }
      // Filtro de tipo
      if (selectedTypeFilter !== 'Todos' && t.type !== selectedTypeFilter) {
        return false;
      }
      // Filtro de categoría
      if (selectedCategoryId !== 'Todos' && t.category_id !== selectedCategoryId) {
        return false;
      }
      // Búsqueda de texto o monto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const catName = (categoriesMap[t.category_id || '']?.name || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const author = t.user_name.toLowerCase();
        const amtStr = t.amount.toString();

        // Si la búsqueda contiene "> 5000" o similar
        if (query.startsWith('>') || query.startsWith('+')) {
          const targetNum = parseFloat(query.replace(/[^0-9.]/g, ''));
          if (!isNaN(targetNum)) {
            return t.amount >= targetNum;
          }
        }

        const matches =
          desc.includes(query) ||
          catName.includes(query) ||
          author.includes(query) ||
          amtStr.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [transactions, selectedPersonFilter, selectedTypeFilter, selectedCategoryId, searchQuery, categoriesMap]);

  // Agrupación por fechas para cabeceras limpias
  const groupedData = useMemo(() => {
    const groups: { dateLabel: string; data: Transaction[] }[] = [];
    const dateMap: Record<string, Transaction[]> = {};

    for (const tx of filteredTransactions) {
      const label = getDateHeaderLabel(tx.date);
      if (!dateMap[label]) {
        dateMap[label] = [];
      }
      dateMap[label].push(tx);
    }

    for (const [dateLabel, data] of Object.entries(dateMap)) {
      groups.push({ dateLabel, data });
    }

    return groups;
  }, [filteredTransactions]);

  const handleOpenActions = (tx: Transaction) => {
    setActiveTx(tx);
    setActionModalVisible(true);
  };

  const confirmDelete = (tx: Transaction) => {
    Alert.alert(
      '¿Eliminar este movimiento?',
      `¿Deseas eliminar "${tx.description || 'Movimiento'}" por RD$${tx.amount.toLocaleString()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const copy = { ...tx };
            deleteTransaction(tx.id);
            if (activeTx?.id === tx.id) {
              setActionModalVisible(false);
              setActiveTx(null);
            }
            toast.undo('Movimiento eliminado', () => {
              restoreTransaction(copy);
            });
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    if (!activeTx) return;
    duplicateTransaction(activeTx.id);
    setActionModalVisible(false);
    setActiveTx(null);
    toast.success('✓ Movimiento duplicado');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Barra de Búsqueda Global */}
      <View style={[styles.headerArea, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por concepto, persona o monto (ej: >5000)..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Chips de Filtro Rápido */}
        <View style={styles.filterScroll}>
          {/* Persona */}
          <View style={styles.chipGroup}>
            {(['Todos', 'Joel', 'Kath'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPersonFilter(p)}
                style={[
                  styles.filterChip,
                  selectedPersonFilter === p && styles.filterChipActive,
                  { borderColor: selectedPersonFilter === p ? BrandColors.deepBlue : theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPersonFilter === p
                      ? styles.filterChipTextActive
                      : { color: theme.textSecondary },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tipo */}
          <View style={styles.chipGroup}>
            {(['Todos', 'expense', 'income', 'transfer'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedTypeFilter(t)}
                style={[
                  styles.filterChip,
                  selectedTypeFilter === t && styles.filterChipActive,
                  { borderColor: selectedTypeFilter === t ? BrandColors.deepBlue : theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedTypeFilter === t
                      ? styles.filterChipTextActive
                      : { color: theme.textSecondary },
                  ]}
                >
                  {t === 'Todos' ? 'Todos' : t === 'expense' ? 'Gastos' : t === 'income' ? 'Ingresos' : 'Transferencias'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Lista Agrupada Cronológica */}
      <FlatList
        data={groupedData}
        keyExtractor={(item) => item.dateLabel}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.dateGroupContainer}>
            <Text style={[styles.dateGroupHeader, { color: theme.textSecondary }]}>
              {item.dateLabel}
            </Text>
            {item.data.map((tx) => (
              <JKTransactionCard
                key={tx.id}
                transaction={tx}
                category={categoriesMap[tx.category_id || '']}
                onPress={() => {
                  setEditingTx(tx);
                  setAddModalVisible(true);
                }}
                onEdit={() => {
                  setEditingTx(tx);
                  setAddModalVisible(true);
                }}
                onDelete={() => confirmDelete(tx)}
                onLongPress={() => handleOpenActions(tx)}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <JKEmptyState
            title="Sin movimientos registrados"
            description="Aún no hay transacciones para mostrar con los filtros seleccionados."
            actionLabel="Limpiar filtros"
            onAction={() => {
              setSearchQuery('');
              setSelectedPersonFilter('Todos');
              setSelectedTypeFilter('Todos');
              setSelectedCategoryId('Todos');
            }}
          />
        }
      />

      {/* Modal de Acciones para el Movimiento Seleccionado */}
      <JKModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title="Opciones de Movimiento"
      >
        {activeTx && (
          <View style={styles.modalContent}>
            <View style={styles.txDetailHeader}>
              <Text style={[styles.modalTxTitle, { color: theme.textPrimary }]}>
                {activeTx.description || categoriesMap[activeTx.category_id || '']?.name || 'Movimiento'}
              </Text>
              <Text
                style={[
                  styles.modalTxAmount,
                  {
                    color: activeTx.type === 'income' ? BrandColors.success : theme.textPrimary,
                  },
                ]}
              >
                {activeTx.type === 'income' ? '+' : '-'}
                {formatCurrency(activeTx.amount, currency)}
              </Text>
              <Text style={[styles.modalTxSub, { color: theme.textMuted }]}>
                Registrado por {activeTx.user_name} • {activeTx.date}
              </Text>
            </View>

            <View style={styles.modalActionsCol}>
              <JKButton
                title="Editar Movimiento"
                onPress={() => {
                  const txToEdit = activeTx;
                  setActionModalVisible(false);
                  setActiveTx(null);
                  setEditingTx(txToEdit);
                  setAddModalVisible(true);
                }}
                variant="primary"
                size="md"
                style={{ marginBottom: Spacing.sm }}
              />

              <JKButton
                title="Duplicar Movimiento"
                onPress={handleDuplicate}
                variant="secondary"
                size="md"
                style={{ marginBottom: Spacing.sm }}
              />

              <JKButton
                title="Eliminar Movimiento"
                onPress={() => activeTx && confirmDelete(activeTx)}
                variant="danger"
                size="md"
              />
            </View>
          </View>
        )}
      </JKModal>

      {/* Modal para añadir o editar movimiento */}
      <AddTransactionModal
        visible={addModalVisible}
        initialTransaction={editingTx}
        onClose={() => {
          setAddModalVisible(false);
          setEditingTx(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    marginBottom: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterScroll: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: BrandColors.deepBlue,
    borderColor: BrandColors.deepBlue,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 90,
  },
  dateGroupContainer: {
    marginTop: Spacing.md,
  },
  dateGroupHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  modalContent: {
    width: '100%',
  },
  txDetailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTxTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalTxAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  modalTxSub: {
    fontSize: 12,
  },
  modalActionsCol: {
    width: '100%',
  },
});
