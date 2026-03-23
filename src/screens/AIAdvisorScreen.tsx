import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';
import { useFinance } from '../store/FinanceContext';
import { useModelService } from '../services/ModelService';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { ModelLoaderWidget } from '../components/ModelLoaderWidget';
import { streamFinanceAdvice, AIMessage } from '../services/FinanceAIService';

// ─── Typing indicator ──────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => {
  const dots = [useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={ti.container}>
      <View style={ti.bubble}>
        {dots.map((d, i) => (
          <Animated.Text key={i} style={[ti.dot, { opacity: d }]}>•</Animated.Text>
        ))}
      </View>
    </View>
  );
};

const ti = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 12, paddingLeft: 16 },
  bubble: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  dot: { fontSize: 20, color: AppColors.accentCyan },
});

// ─── Message bubble ────────────────────────────────────────────────────────

interface BubbleProps { message: AIMessage; }

const MessageBubble: React.FC<BubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <View style={[bubble.row, isUser && bubble.rowUser]}>
      {!isUser && <Text style={bubble.avatar}>🤖</Text>}
      <View style={[bubble.container, isUser ? bubble.userBubble : bubble.aiBubble]}>
        <Text style={[bubble.text, isUser && bubble.userText]}>{message.content}</Text>
      </View>
    </View>
  );
};

const bubble = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 16 },
  rowUser: { justifyContent: 'flex-end' },
  avatar: { fontSize: 22, marginRight: 8, marginBottom: 2 },
  container: { maxWidth: '80%', borderRadius: 18, padding: 14 },
  aiBubble: {
    backgroundColor: AppColors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  userBubble: { backgroundColor: AppColors.accentViolet, borderBottomRightRadius: 4 },
  text: { fontSize: 14, color: AppColors.textPrimary, lineHeight: 21 },
  userText: { color: '#fff' },
});

// ─── Suggested prompts ─────────────────────────────────────────────────────

const SUGGESTIONS = [
  '📊 Summarise my spending this month',
  '💡 Where can I save more?',
  '🎯 Am I on track with my budget?',
  '📈 What are my top 3 expenses?',
];

// ─── Main screen ───────────────────────────────────────────────────────────

export const AIAdvisorScreen: React.FC = () => {
  const { state } = useFinance();
  const { isLLMLoaded, isLLMDownloading, isLLMLoading, llmDownloadProgress, downloadAndLoadLLM } =
    useModelService();

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your on-device Finance Advisor 🔒\n\nAll analysis runs entirely on your device — no data ever leaves your phone.\n\nAsk me anything about your spending, budget, or savings!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const listRef = useRef<FlatList<AIMessage | { id: '__typing__' }>>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || isGenerating || !isLLMLoaded) return;

      const userMsg: AIMessage = { role: 'user', content: userText };
      const history = [...messages];
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsGenerating(true);
      scrollToBottom();

      // Placeholder AI message that we'll stream into
      const aiMsg: AIMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, aiMsg]);

      let accumulated = '';
      await streamFinanceAdvice(
        userText,
        history,
        state.transactions,
        (token: string) => {
          accumulated += token;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: accumulated };
            return updated;
          });
          scrollToBottom();
        },
      );

      setIsGenerating(false);
      scrollToBottom();
    },
    [isGenerating, isLLMLoaded, messages, state.transactions, scrollToBottom],
  );

  // ─── Render ───

  if (!isLLMLoaded) {
    return (
      <View style={styles.loaderWrapper}>
        <LinearGradient
          colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
          style={styles.gradient}
        >
          <Text style={styles.loaderTitle}>AI Financial Advisor</Text>
          <Text style={styles.loaderSub}>
            Load the on-device LLM to start getting personalised, private financial advice.
          </Text>
          <PrivacyBadge />
          <View style={{ height: 24 }} />
          <ModelLoaderWidget
            title="LFM2 350M – On-Device LLM"
            subtitle="Download once, runs fully offline. Your finances stay private."
            icon="🤖"
            accentColor={AppColors.accentViolet}
            isDownloading={isLLMDownloading}
            isLoading={isLLMLoading}
            progress={llmDownloadProgress}
            onLoad={downloadAndLoadLLM}
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
        style={styles.gradient}
      >
        {/* Privacy header */}
        <View style={styles.privacyRow}>
          <PrivacyBadge />
          {isGenerating && (
            <View style={styles.generatingBadge}>
              <ActivityIndicator size="small" color={AppColors.accentCyan} />
              <Text style={styles.generatingText}>Generating locally…</Text>
            </View>
          )}
        </View>

        {/* Chat list */}
        <FlatList
          ref={listRef as any}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item as AIMessage} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={isGenerating ? null : undefined}
          showsVerticalScrollIndicator={false}
        />

        {/* Suggestion chips (shown when no user message yet) */}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestion}
                onPress={() => sendMessage(s)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your finances…"
            placeholderTextColor={AppColors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isGenerating) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isGenerating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[AppColors.accentCyan, AppColors.accentViolet]}
              style={styles.sendGradient}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  gradient: { flex: 1 },
  loaderWrapper: { flex: 1, backgroundColor: AppColors.primaryDark },
  loaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginTop: 40,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  loaderSub: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginHorizontal: 24,
    marginBottom: 20,
    lineHeight: 21,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  generatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.accentCyan + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.accentCyan + '33',
  },
  generatingText: { fontSize: 11, color: AppColors.accentCyan, fontWeight: '600' },
  messageList: { paddingTop: 8, paddingBottom: 16 },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  suggestion: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: AppColors.accentViolet + '44',
  },
  suggestionText: { fontSize: 13, color: AppColors.accentViolet, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceElevated,
    backgroundColor: AppColors.primaryDark,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: AppColors.surfaceElevated,
  },
  sendBtn: { borderRadius: 22 },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { fontSize: 18, color: '#fff' },
});
