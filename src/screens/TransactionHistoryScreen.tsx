import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';
import { useFinance } from '../store/FinanceContext';
import { TransactionItem } from '../components/TransactionItem';
import { CategoryBadge } from '../components/CategoryBadge';
import { CATEGORIES, CategoryId, TransactionType, formatCurrency } from '../types/finance';

export const TransactionHistoryScreen: React.FC = () => {
  const { state, deleteTransaction, monthlyExpenses, monthlyIncome } = useFinance();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCat, setFilterCat] = useState<CategoryId | 'all'>('all');

  const filtered = useMemo(() => {
    return state.transactions.filter(t => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCat  = filterCat  === 'all' || t.categoryId === filterCat;
      const matchSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        CATEGORIES[t.categoryId].label.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [state.transactions, filterType, filterCat, search]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
        style={styles.gradient}
      >
        {/* Summary header */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: AppColors.accentGreen }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: AppColors.accentOrange }]}>
              {formatCurrency(monthlyExpenses)}
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions…"
            placeholderTextColor={AppColors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Type filter */}
        <View style={styles.filterRow}>
          {(['all', 'income', 'expense'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, filterType === t && styles.filterChipActive]}
              onPress={() => setFilterType(t)}
            >
              <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
                {t === 'all' ? 'All' : t === 'income' ? '📥 Income' : '📤 Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category quick-filter */}
        <View style={styles.catScrollWrapper}>
          <FlatList
            horizontal
            data={['all', ...Object.keys(CATEGORIES)] as (CategoryId | 'all')[]}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            renderItem={({ item }) =>
              item === 'all' ? (
                <TouchableOpacity
                  style={[styles.allChip, filterCat === 'all' && styles.allChipActive]}
                  onPress={() => setFilterCat('all')}
                >
                  <Text style={[styles.allChipText, filterCat === 'all' && { color: AppColors.accentCyan }]}>
                    All
                  </Text>
                </TouchableOpacity>
              ) : (
                <CategoryBadge
                  category={CATEGORIES[item as CategoryId]}
                  selected={filterCat === item}
                  onPress={() => setFilterCat(filterCat === item ? 'all' : (item as CategoryId))}
                />
              )
            }
          />
        </View>

        {/* Transaction list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onDelete={deleteTransaction} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔎</Text>
              <Text style={styles.emptyText}>No matching transactions found.</Text>
            </View>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  gradient: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },
  summaryBox: { flex: 1 },
  summaryLabel: { fontSize: 11, color: AppColors.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: AppColors.textPrimary, fontSize: 14, paddingVertical: 12 },
  clearIcon: { fontSize: 13, color: AppColors.textMuted },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  filterChipActive: { backgroundColor: AppColors.accentCyan + '22', borderColor: AppColors.accentCyan },
  filterChipText: { fontSize: 12, color: AppColors.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: AppColors.accentCyan },
  catScrollWrapper: { marginBottom: 8 },
  allChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
    marginRight: 8,
    marginBottom: 8,
  },
  allChipActive: { backgroundColor: AppColors.accentCyan + '22', borderColor: AppColors.accentCyan },
  allChipText: { fontSize: 12, color: AppColors.textMuted, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: AppColors.textSecondary },
});
