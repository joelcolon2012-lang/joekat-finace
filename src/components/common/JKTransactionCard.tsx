// Componente JKTransactionCard para visualizar cada movimiento financiero
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';
import { formatDateSpanish } from '../../utils/date';
import { JKAvatar } from './JKAvatar';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface JKTransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const JKTransactionCard: React.FC<JKTransactionCardProps> = ({
  transaction,
  category,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
}) => {
  const { theme, currency } = useThemeStore();
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const categoryName = category?.name || (isTransfer ? 'Transferencia' : 'General');
  const iconName = (category?.icon || (isTransfer ? 'swap-horizontal' : 'wallet')) as any;
  const iconBg = category?.color || BrandColors.deepBlue;

  // Distintivo de autor (Joel corporativo / Kath rosa elegante)
  const isKath = transaction.user_name === 'Kath' || transaction.user_name === 'Kat';
  const isJoel = transaction.user_name === 'Joel';

  const pillBg = isKath ? KathColors.pale : isJoel ? JoelColors.pale : theme.surfaceCardAlt;
  const pillText = isKath ? KathColors.primary : isJoel ? JoelColors.primary : theme.textSecondary;
  const pillBorder = isKath ? KathColors.border : isJoel ? JoelColors.border : theme.border;

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else if (onEdit) {
      onEdit();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleCardPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Icono de la categoría */}
      <View style={[styles.categoryIconCircle, { backgroundColor: `${iconBg}18` }]}>
        <Ionicons name={iconName} size={20} color={iconBg} />
      </View>

      {/* Concepto y detalles */}
      <View style={styles.detailsCol}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {transaction.description || categoryName}
        </Text>
        <View style={styles.subRow}>
          <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
            {categoryName}
          </Text>
          <Text style={[styles.dotSeparator, { color: theme.textMuted }]}>•</Text>
          <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
            {formatDateSpanish(transaction.date)}
          </Text>
        </View>

        {/* Pill de autor */}
        <View style={styles.registeredByRow}>
          <View style={[styles.authorPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
            <JKAvatar name={transaction.user_name} size={14} />
            <Text style={[styles.authorLabel, { color: pillText }]}>
              {transaction.user_name}
            </Text>
          </View>
          {transaction.payment_method && (
            <Text style={[styles.paymentMethod, { color: theme.textMuted }]} numberOfLines={1}>
              {transaction.payment_method}
            </Text>
          )}
        </View>
      </View>

      {/* Monto del movimiento y acciones rápidas */}
      <View style={styles.amountCol}>
        <Text
          style={[
            styles.amountText,
            {
              color: isIncome
                ? BrandColors.success
                : isTransfer
                ? BrandColors.mediumBlue
                : theme.textPrimary,
            },
          ]}
        >
          {isIncome ? '+' : isTransfer ? '' : '-'}
          {formatCurrency(transaction.amount, currency)}
        </Text>

        {(onEdit || onDelete) && (
          <View style={styles.actionButtonsRow}>
            {onEdit && (
              <TouchableOpacity
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  onEdit();
                }}
                style={[styles.actionBtn, { backgroundColor: `${BrandColors.deepBlue}12` }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil-outline" size={13} color={BrandColors.deepBlue} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  onDelete();
                }}
                style={[styles.actionBtn, { backgroundColor: `${BrandColors.danger}12`, marginLeft: 6 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={13} color={BrandColors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginVertical: 4,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotSeparator: {
    marginHorizontal: 4,
    fontSize: 12,
  },
  dateLabel: {
    fontSize: 11,
  },
  registeredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginRight: 6,
  },
  authorLabel: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '700',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  paymentMethod: {
    fontSize: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
