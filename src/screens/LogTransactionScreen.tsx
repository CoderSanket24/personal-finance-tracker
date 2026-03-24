import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useFinance } from '../store/FinanceContext';
import { useModelService } from '../services/ModelService';
import { CategoryBadge } from '../components/CategoryBadge';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { PrivacyBadge } from '../components/PrivacyBadge';
import {
  CATEGORIES,
  CategoryId,
  TransactionType,
  generateId,
  Transaction,
} from '../types/finance';
import { parseVoiceTransaction } from '../services/FinanceAIService';
import { RootStackParamList } from '../navigation/types';

type LogTransactionScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LogTransaction'>;
};

const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export const LogTransactionScreen: React.FC<LogTransactionScreenProps> = ({ navigation }) => {
  const { addTransaction } = useFinance();
  const { 
    isSTTLoaded, 
    isSTTDownloading, 
    isSTTLoading, 
    downloadAndLoadSTT,
    sttDownloadProgress
  } = useModelService();

  useEffect(() => {
    // Automatically trigger download/load of STT model when screen opens
    if (!isSTTLoaded && !isSTTDownloading && !isSTTLoading) {
      downloadAndLoadSTT();
    }
  }, [isSTTLoaded, isSTTDownloading, isSTTLoading, downloadAndLoadSTT]);

  const [txnType, setTxnType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('food');
  const [isVoiceLogged, setIsVoiceLogged] = useState(false);

  const handleVoiceTranscript = useCallback((text: string) => {
    setIsVoiceLogged(true);
    const parsed = parseVoiceTransaction(text);
    if (parsed.amount !== null) setAmount(String(parsed.amount));
    setDescription(parsed.description);
  }, []);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a short description.');
      return;
    }

    const txn: Transaction = {
      id: generateId(),
      type: txnType,
      amount: numAmount,
      categoryId: selectedCategory,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
      isVoiceLogged,
    };

    addTransaction(txn);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <LinearGradient
        colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Log Transaction</Text>
            <PrivacyBadge />
          </View>

          {/* Type toggle */}
          <View style={styles.typeToggle}>
            {(['expense', 'income'] as TransactionType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, txnType === t && styles.typeBtnActive]}
                onPress={() => setTxnType(t)}
              >
                <Text style={[styles.typeBtnText, txnType === t && styles.typeBtnTextActive]}>
                  {t === 'expense' ? '📤 Expense' : '📥 Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₹)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={v => { setDescription(v); setIsVoiceLogged(false); }}
              placeholder="What was this for?"
              placeholderTextColor={AppColors.textMuted}
            />
          </View>

          {/* Voice input */}
          <View style={styles.voiceSection}>
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              isSTTLoaded={isSTTLoaded}
              isSTTDownloading={isSTTDownloading}
              isSTTLoading={isSTTLoading}
              sttDownloadProgress={sttDownloadProgress}
            />
            <Text style={styles.voiceHint}>
              Say e.g. "500 rupees for groceries" to auto-fill
            </Text>
          </View>

          {/* Category picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_IDS.map(id => (
                <CategoryBadge
                  key={id}
                  category={CATEGORIES[id]}
                  selected={selectedCategory === id}
                  onPress={() => setSelectedCategory(id)}
                />
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85}>
            <LinearGradient
              colors={[AppColors.accentCyan, '#0EA5E9']}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>Save Transaction</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.primaryDark },
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  gradient: { flex: 1 },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.textPrimary },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: AppColors.surfaceElevated },
  typeBtnText: { fontSize: 14, color: AppColors.textMuted, fontWeight: '600' },
  typeBtnTextActive: { color: AppColors.textPrimary },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: AppColors.textSecondary, marginBottom: 8, fontWeight: '600' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  rupeeSymbol: { fontSize: 22, color: AppColors.textMuted, marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
    paddingVertical: 14,
  },
  descInput: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: AppColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  voiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    padding: 16,
  },
  voiceHint: { flex: 1, fontSize: 12, color: AppColors.textMuted, lineHeight: 18 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
