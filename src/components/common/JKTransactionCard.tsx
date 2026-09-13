// =====================================================================
// COMPONENTE JKTransactionCard - FINTECH GLASSMORPHISM
// Muestra responsable (Joel/Kath/Compartido), monto, acciones (editar, duplicar, borrar)
// =====================================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Transaction, Category } from '../../types';
import { Colors, Radius } from '../../theme/designTokens';
import { formatCurrency } from '../../utils/currency';
import { formatDateSpanish } from '../../utils/date';

interface JKTransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onLongPress?: () => void;
}

export const JKTransactionCard: React.FC<JKTransactionCardProps> = ({
  transaction,
  category,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  onLongPress,
}) => {
  const { isDarkMode } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isSavings = transaction.type === 'savings';
  const isDebt = transaction.type === 'debt';

  const categoryName = category?.name || (isTransfer ? 'Transferencia' : isSavings ? 'Ahorro' : isDebt ? 'Deuda' : 'General');
  const iconName = (category?.icon || (isTransfer ? 'swap-horizontal' : isSavings ? 'wallet' : isDebt ? 'calendar' : 'pricetag')) as any;

  // Responsable: Joel / Kath / Compartido
  const ownerLabel = transaction.owner === 'shared' ? 'Compartido' : transaction.user_name || 'Joel';
  const isKath = ownerLabel === 'Kath' || ownerLabel === 'Kat';
  const isJoel = ownerLabel === 'Joel';

  let amountColor = '#F87171'; // Gasto
  let amountPrefix = '-';
  if (isIncome) {
    amountColor = Colors.secondaryGreen;
    amountPrefix = '+';
  } else if (isTransfer) {
    amountColor = Colors.transfer;
    amountPrefix = '↔';
  } else if (isSavings) {
    amountColor = Colors.savings;
    amountPrefix = '◎';
  } else if (isDebt) {
    amountColor = Colors.debt;
    amountPrefix = '▣';
  }

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress || onEdit}
        style={[
          styles.card,
          !isDarkMode && styles.cardLight,
          Platform.OS === 'web' ? ({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          } as any) : null,
        ]}
      >
        {/* Icono de Categoría */}
        <View style={[styles.iconCircle, !isDarkMode && { backgroundColor: 'rgba(15, 118, 110, 0.08)' }]}>
          <Ionicons
            name={iconName}
            size={18}
            color={isIncome ? Colors.secondaryGreen : isDarkMode ? Colors.ivoryWhite : Colors.primaryGreen}
          />
        </View>

        {/* Concepto y Metadatos */}
        <View style={styles.infoCol}>
          <Text style={[styles.descriptionText, !isDarkMode && { color: '#071827' }]} numberOfLines={1}>
            {transaction.description || categoryName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.categoryBadge}>{categoryName}</Text>
            <Text style={[styles.dotSeparator, !isDarkMode && { color: '#94A3B8' }]}>•</Text>
            <Text style={[styles.dateText, !isDarkMode && { color: '#64748B' }]}>{formatDateSpanish(transaction.date)}</Text>
          </View>

          {/* Badge de Responsable */}
          <View style={styles.ownerRow}>
            <View
              style={[
                styles.ownerPill,
                isKath && styles.ownerPillKath,
                isJoel && styles.ownerPillJoel,
                !isKath && !isJoel && (isDarkMode ? styles.ownerPillShared : styles.ownerPillSharedLight),
              ]}
            >
              <Ionicons
                name={isKath ? 'sparkles' : isJoel ? 'person' : 'people'}
                size={11}
                color={!isDarkMode && !isKath && !isJoel ? '#0F766E' : Colors.ivoryWhite}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.ownerText, !isDarkMode && !isKath && !isJoel && { color: '#0F766E' }]}>{ownerLabel}</Text>
            </View>
          </View>
        </View>

        {/* Monto y Botón de Menú Rápido */}
        <View style={styles.rightCol}>
          <Text style={[styles.amountText, { color: amountColor }]} numberOfLines={1}>
            {amountPrefix}{formatCurrency(transaction.amount, 'DOP')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.moreBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={!isDarkMode ? '#64748B' : Colors.ivoryTranslucent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Menú de Acciones Rápidas (Transparente con blur) */}
      {menuOpen ? (
        <View style={styles.actionMenuRow}>
          {onEdit ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
              style={[
                styles.menuItem,
                !isDarkMode && styles.menuItemLight,
                Platform.OS === 'web' ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any) : null,
              ]}
            >
              <Ionicons name="create-outline" size={14} color={Colors.secondaryGreen} />
              <Text style={[styles.menuItemText, !isDarkMode && { color: '#071827' }]}>Editar</Text>
            </TouchableOpacity>
          ) : null}

          {onDuplicate ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMenuOpen(false);
                onDuplicate();
              }}
              style={[
                styles.menuItem,
                !isDarkMode && styles.menuItemLight,
                Platform.OS === 'web' ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any) : null,
              ]}
            >
              <Ionicons name="copy-outline" size={14} color={Colors.transfer} />
              <Text style={[styles.menuItemText, !isDarkMode && { color: '#071827' }]}>Duplicar</Text>
            </TouchableOpacity>
          ) : null}

          {onDelete ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              style={[
                styles.menuItem,
                !isDarkMode && styles.menuItemLight,
                Platform.OS === 'web' ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any) : null,
              ]}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Eliminar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  ownerPillSharedLight: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ivoryWhite,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryGreen,
  },
  dotSeparator: {
    fontSize: 11,
    color: Colors.ivoryMuted,
    marginHorizontal: 5,
  },
  dateText: {
    fontSize: 11,
    color: Colors.ivoryTranslucent,
  },
  ownerRow: {
    flexDirection: 'row',
  },
  ownerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  ownerPillJoel: {
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
  },
  ownerPillKath: {
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
  },
  ownerPillShared: {
    backgroundColor: 'rgba(248, 245, 236, 0.15)',
  },
  ownerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  rightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  moreBtn: {
    padding: 2,
  },
  actionMenuRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
    paddingRight: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 42, 67, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemLight: {
    backgroundColor: 'rgba(248, 245, 236, 0.94)',
    borderColor: 'rgba(7, 24, 39, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});
