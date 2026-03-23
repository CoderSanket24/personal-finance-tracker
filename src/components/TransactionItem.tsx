import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppColors } from '../theme';
import { Transaction, CATEGORIES, formatCurrency } from '../types/finance';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  const cat = CATEGORIES[transaction.categoryId];
  const isIncome = transaction.type === 'income';

  return (
    <View style={styles.container}>
      {/* Category icon bubble */}
      <View style={[styles.iconBubble, { backgroundColor: cat.color + '22' }]}>
        <Text style={styles.icon}>{cat.icon}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
          {transaction.isVoiceLogged && <Text style={styles.voiceBadge}> 🎤</Text>}
          <Text style={styles.date}> · {transaction.date}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? AppColors.accentGreen : AppColors.error }]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(transaction.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 22 },
  details: { flex: 1, marginRight: 8 },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 3,
  },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  catLabel: { fontSize: 11, fontWeight: '600' },
  voiceBadge: { fontSize: 11, color: AppColors.accentViolet },
  date: { fontSize: 11, color: AppColors.textMuted },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700' },
  deleteBtn: { marginTop: 4, padding: 2 },
  deleteIcon: { fontSize: 11, color: AppColors.textMuted },
});
