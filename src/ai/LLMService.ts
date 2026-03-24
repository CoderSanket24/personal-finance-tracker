import { RunAnywhere } from '@runanywhere/core';
import { DatabaseService } from '../database/DatabaseService';
import { formatCurrency, CATEGORIES } from '../types/finance';
import { AIMessage } from '../services/FinanceAIService';

/**
 * Parses the raw SQLite categorical aggregation map into a clean Markdown string.
 */
function formatCategorizedSpending(aggregations: Record<string, number>): string {
  const entries = Object.entries(aggregations);
  if (entries.length === 0) {
    return '  * No expenses logged for this month.';
  }

  // Sort by highest expense first to help the LLM instantly see the primary drain
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([catId, amount]) => {
      // Clean mapping, fallback to raw ID if untracked category appears
      const label = CATEGORIES[catId as keyof typeof CATEGORIES]?.label ?? catId;
      // Force an explicit "Rs." string instead of relying on Intl.NumberFormat's native ₹ Unicode 
      return `  - ${label}: Rs. ${amount.toLocaleString('en-IN')} (INR)`;
    })
    .join('\n');
}

/**
 * High-performance autonomous AI Service parsing raw SQLite Data into analytical advice.
 */
class AutonomousLLMServiceImpl {
  /**
   * Generates highly constrained, deterministic financial advice based purely on local SQL aggregations.
   *
   * @param month Numeric month (1-12)
   * @param year 4-digit numeric year
   * @returns Formatted Markdown string emitted by the Local LLM
   */
  public async generateFinancialAdvice(
    userMessage: string,
    history: AIMessage[],
    month: number, 
    year: number,
    onToken: (token: string) => void
  ): Promise<string> {
    try {
      const totalBalance = await DatabaseService.getWalletBalance();
      const monthStr = month.toString();
      const yearStr = year.toString();
      const aggregations = await DatabaseService.getAggregatedSpendingByCategory(monthStr, yearStr);

      const formattedSpending = formatCategorizedSpending(aggregations);
      
      const isDataEmpty = Object.keys(aggregations).length === 0;

      // Programmatic Guardrail: Force the 350M LLM to physically not process empty semantic state arrays
      if (isDataEmpty && totalBalance === 0) {
        const emptyResponse = "I can't analyze your spending yet because you haven't logged any transactions for this month!\n\nUse the **Log Transaction** button on the dashboard to add your expenses or income, and I'll give you customized mathematical advice in Rupees (₹).";
        
        // Simulate a natural text generation stream for the UI
        for (const word of emptyResponse.split(' ')) {
          onToken(word + ' ');
          // Very slight delay for natural streaming
          await new Promise(r => setTimeout(r, 15));
        }
        return emptyResponse;
      }

      const userDataContext = `<financial_data>
Current Wallet Balance: ${totalBalance === 0 ? 'Rs. 0 (Empty)' : formatCurrency(totalBalance)}
Categorized Spending For This Month:
${formattedSpending}
</financial_data>`;

      const systemPrompt = `You are a strict, analytical, and highly secure offline financial advisor. You analyze spending data locally on the user's device. 
Your primary directive is absolute mathematical precision based ONLY on the provided <financial_data>. 
DO NOT hallucinate external transactions, DO NOT invent numbers, and DO NOT give generic budgeting templates.

${userDataContext}

[CRITICAL DIRECTIVES]:
1. If the <financial_data> shows "No expenses logged", you MUST immediately reply that there is no data to analyze yet and politely ask them to log a transaction. DO NOT invent spending.
2. You MUST ONLY use "Rs." or "INR" for all monetary values. Absolutely NEVER use Dollars ($).
3. If data exists, analyze the spending distribution and suggest a specific mathematical way to cut down the highest expense.
4. Format your response strictly in Markdown (headers, bullet points, bold text).`;

      // Build conversation history
      const historyText = history
        .map(m => `${m.role === 'user' ? 'User' : 'Advisor'}: ${m.content.replace(/Advisor: Based on your recent spending in Rs. \(INR\), /g, '')}`)
        .join('\n');

      // Semantically hijack the 350M generative prefix to force obedience to the Indian Rupee space
      const prompt = historyText
        ? `${historyText}\nUser: ${userMessage}\nAdvisor: Based on your recent spending in Rs. (INR), `
        : `User: ${userMessage}\nAdvisor: Based on your recent spending in Rs. (INR), `;

      console.log('Initiating Local LLM Analysis based on SQLite aggregations...');
      let finalAdvice = '';

      const stream = await RunAnywhere.generateStream(prompt, {
        systemPrompt,
        maxTokens: 400,
        temperature: 0.1, 
        topP: 0.9,
      });

      for await (const token of stream.stream) {
        finalAdvice += token;
        onToken(token);
      }

      return finalAdvice.trim();

    } catch (e: any) {
      console.error('LLM Inference Engine Error:', e);
      const fallback = `### ⚠️ AI Processing Offline\n\nI encountered an error loading the model. Ensure \`LFM2-350M\` is downloaded. Avoid using '$' and wait. \n\n*Error Trace: ${e.message || 'Unknown Exception'}*`;
      onToken(fallback);
      return fallback;
    }
  }
}

export const LLMService = new AutonomousLLMServiceImpl();
