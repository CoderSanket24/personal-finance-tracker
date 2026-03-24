import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useFinance } from '../store/FinanceContext';
import { SpendingCard } from '../components/SpendingCard';
import { TransactionItem } from '../components/TransactionItem';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { RootStackParamList } from '../navigation/types';
import { currentMonthLabel } from '../types/finance';

type DashboardScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { monthlyExpenses, monthlyIncome, currentMonthTxns, state, deleteTransaction } = useFinance();

  const recentTxns = currentMonthTxns.slice(0, 5);

  const handleDelete = useCallback((id: string) => deleteTransaction(id), [deleteTransaction]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good evening 👋</Text>
              <Text style={styles.title}>Finance Tracker</Text>
            </View>
            <PrivacyBadge />
          </View>

          {/* Spending summary card */}
          <SpendingCard
            totalIncome={monthlyIncome}
            totalExpenses={monthlyExpenses}
            monthlyBudget={state.monthlyBudget}
            monthLabel={currentMonthLabel()}
          />

          {/* Quick actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('LogTransaction')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[AppColors.accentCyan, '#0EA5E9']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionLabel}>Log Expense</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AIAdvisor')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[AppColors.accentViolet, '#7C3AED']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🤖</Text>
                <Text style={styles.actionLabel}>AI Advisor</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('TransactionHistory')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[AppColors.accentGreen, '#059669']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>History</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Recent transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentTxns.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyText}>No transactions yet. Tap + to log one!</Text>
              </View>
            ) : (
              recentTxns.map(txn => (
                <TransactionItem key={txn.id} transaction={txn} onDelete={handleDelete} />
              ))
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  gradient: { flex: 1 },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: AppColors.textMuted, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.5 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn: { flex: 1 },
  actionGradient: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  seeAll: { fontSize: 13, color: AppColors.accentCyan, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: AppColors.textSecondary, textAlign: 'center' },
});
