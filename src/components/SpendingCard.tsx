import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';
import { formatCurrency } from '../types/finance';

interface SpendingCardProps {
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget: number;
  monthLabel: string;
}

export const SpendingCard: React.FC<SpendingCardProps> = ({
  totalIncome,
  totalExpenses,
  monthlyBudget,
  monthLabel,
}) => {
  const savings = totalIncome - totalExpenses;
  const budgetUsedPct = monthlyBudget > 0 ? Math.min((totalExpenses / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = totalExpenses > monthlyBudget;

  return (
    <LinearGradient
      colors={['#1E3A5F', '#0F2440', '#121D33']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Month label */}
      <Text style={styles.monthLabel}>{monthLabel}</Text>

      {/* Net savings */}
      <Text style={styles.savingsLabel}>Net Savings</Text>
      <Text style={[styles.savingsAmount, { color: savings >= 0 ? AppColors.accentGreen : AppColors.error }]}>
        {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
      </Text>

      {/* Income / Expense row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📥</Text>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: AppColors.accentGreen }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📤</Text>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, { color: AppColors.accentOrange }]}>
            {formatCurrency(totalExpenses)}
          </Text>
        </View>
      </View>

      {/* Budget progress bar */}
      <View style={styles.budgetSection}>
        <View style={styles.budgetLabels}>
          <Text style={styles.budgetText}>Budget used</Text>
          <Text style={[styles.budgetText, { color: isOverBudget ? AppColors.error : AppColors.textSecondary }]}>
            {budgetUsedPct.toFixed(0)}% of {formatCurrency(monthlyBudget)}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${budgetUsedPct}%` as any,
                backgroundColor: isOverBudget ? AppColors.error : AppColors.accentCyan,
              },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.accentCyan + '22',
    elevation: 8,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  monthLabel: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  savingsLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: AppColors.primaryDark + '66',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statLabel: { fontSize: 11, color: AppColors.textMuted, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
  divider: {
    width: 1,
    backgroundColor: AppColors.textMuted + '33',
    marginVertical: 8,
  },
  budgetSection: {},
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
