import { RunAnywhere } from '@runanywhere/core';
import { Transaction, CATEGORIES, formatCurrency, sumByType } from '../types/finance';

// ─── System prompt builder ─────────────────────────────────────────────────

function buildSystemPrompt(transactions: Transaction[]): string {
  const expenses = transactions.filter(t => t.type === 'expense');
  const income   = transactions.filter(t => t.type === 'income');

  const totalExpense = sumByType(transactions, 'expense');
  const totalIncome  = sumByType(transactions, 'income');
  const netSavings   = totalIncome - totalExpense;

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  for (const t of expenses) {
    catBreakdown[t.categoryId] = (catBreakdown[t.categoryId] ?? 0) + t.amount;
  }
  const catSummary = Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, amt]) => `  • ${CATEGORIES[catId as keyof typeof CATEGORIES]?.label ?? catId}: ${formatCurrency(amt)}`)
    .join('\n');

  // Last 10 transactions formatted
  const recentList = transactions
    .slice(0, 10)
    .map(
      t =>
        `  [${t.date}] ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} | ${
          CATEGORIES[t.categoryId]?.label ?? t.categoryId
        } | ${t.description}`,
    )
    .join('\n');

  return `You are FinanceAI, a privacy-first personal finance advisor. 
All analysis is done entirely ON THIS DEVICE — no data leaves the user's phone.

## User's Financial Snapshot (this month)
- Total Income:  ${formatCurrency(totalIncome)} (${income.length} transactions)
- Total Expense: ${formatCurrency(totalExpense)} (${expenses.length} transactions)
- Net Savings:   ${formatCurrency(netSavings)} (${netSavings >= 0 ? 'positive ✅' : 'deficit ⚠️'})

## Spending by Category
${catSummary || '  (no expenses yet)'}

## Recent Transactions (last 10)
${recentList || '  (no transactions yet)'}

## Your Role
- Be concise, friendly, and actionable (responses ≤ 200 words unless asked for more).
- Provide specific numbers from the data above when giving advice.
- If the user logs a new transaction by voice, acknowledge it and reflect on how it affects their budget.
- Highlight any categories where spending seems high.
- Never make up financial data — only refer to the data shown above.
- NEVER mention sending data to a cloud or server — everything is local.
- Use Indian Rupee (₹) for all amounts.
- End each response with one concrete budgeting tip.`;
}

// ─── AI Service ────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream a response from the on-device LLM given the conversation history
 * and the current transaction data.
 *
 * @param userMessage   The latest message from the user
 * @param history       Previous messages in the conversation
 * @param transactions  Full transaction list for context injection
 * @param onToken       Called with each streamed token
 * @returns             Final full response text
 */
export async function streamFinanceAdvice(
  userMessage: string,
  history: AIMessage[],
  transactions: Transaction[],
  onToken: (token: string) => void,
): Promise<string> {
  // Build conversation as a simple text prompt (model-agnostic)
  const historyText = history
    .map(m => `${m.role === 'user' ? 'User' : 'FinanceAI'}: ${m.content}`)
    .join('\n');

  const prompt = historyText
    ? `${historyText}\nUser: ${userMessage}\nFinanceAI:`
    : `User: ${userMessage}\nFinanceAI:`;

  const systemPrompt = buildSystemPrompt(transactions);

  let fullText = '';

  try {
    const stream = await RunAnywhere.generateStream(prompt, {
      systemPrompt,
      maxTokens: 350,
      temperature: 0.7,
      topP: 0.95,
    });

    for await (const token of stream.stream) {
      fullText += token;
      onToken(token);
    }
  } catch (err: any) {
    const fallback = transactions.length === 0
      ? "I don't see any transactions yet! Add some expenses or income using the Log Transaction button, and I'll give you personalised advice. 💡"
      : "I'm still warming up — please try again in a moment. Make sure the AI model is downloaded from the dashboard.";
    onToken(fallback);
    fullText = fallback;
  }

  return fullText;
}

/**
 * Parse a voice-transcribed sentence into a transaction description + amount.
 * Lightweight heuristic — no model call needed for this.
 */
export function parseVoiceTransaction(transcript: string): {
  amount: number | null;
  description: string;
} {
  // Try to extract a number (possibly with comma separators)
  const numMatch = transcript.match(/[\d,]+(\.\d+)?/);
  const amount = numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : null;
  // Strip the number from description
  const description = transcript.replace(/[\d,]+(\.\d+)?/, '').trim() || transcript;
  return { amount, description };
}
