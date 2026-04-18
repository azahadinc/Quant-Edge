'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating algorithmic trading strategy code.
 *
 * - generateStrategy - A function that generates trading strategy code from a natural language description.
 * - AiStrategyGeneratorInput - The input type for the generateStrategy function.
 * - AiStrategyGeneratorOutput - The return type for the generateStrategy function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiStrategyGeneratorInputSchema = z.object({
  strategyDescription: z
    .string()
    .describe(
      'A natural language description of the algorithmic trading strategy to generate. Include details like entry/exit conditions, indicators, risk management, and any specific Jesse framework features to use.'
    ),
  programmingLanguage: z
    .enum(['python', 'typescript'])
    .default('python')
    .describe(
      'The desired programming language for the strategy code. Jesse strategies are typically Python-based.'
    ),
  existingCode: z
    .string()
    .optional()
    .describe('Optional: Existing strategy code to modify or use as a starting point.'),
});
export type AiStrategyGeneratorInput = z.infer<typeof AiStrategyGeneratorInputSchema>;

const AiStrategyGeneratorOutputSchema = z.object({
  generatedCode: z
    .string()
    .describe(
      'The generated algorithmic trading strategy code based on the description, formatted as a complete, runnable code block.'
    ),
  explanation: z
    .string()
    .optional()
    .describe(
      'A brief explanation of the generated code, highlighting key decisions and how it addresses the strategy description.'
    ),
});
export type AiStrategyGeneratorOutput = z.infer<typeof AiStrategyGeneratorOutputSchema>;

export async function generateStrategy(
  input: AiStrategyGeneratorInput
): Promise<AiStrategyGeneratorOutput> {
  return aiStrategyGeneratorFlow(input);
}

const aiStrategyGeneratorPrompt = ai.definePrompt({
  name: 'aiStrategyGeneratorPrompt',
  input: { schema: AiStrategyGeneratorInputSchema },
  output: { schema: AiStrategyGeneratorOutputSchema },
  prompt: `You are an expert algorithmic trading strategist specializing in the Jesse framework. Your task is to generate clean, runnable Jesse strategy code based on a natural language description.

IMPORTANT: Generate ONLY Jesse-compatible Python code that follows Jesse's exact structure and conventions.

Jesse Framework Requirements:
- Import: \`import jesse.strategies as strategies\` and \`from jesse import utils\`
- Class inheritance: \`class StrategyName(strategies.Strategy)\`
- DNA property: Define hyperparameters in \`dna\` property as a list of dicts
- Setup method: Initialize parameters in \`setup()\` method using \`self.hp\` array
- Entry conditions: Implement \`should_long()\` and/or \`should_short()\` methods
- Position execution: Implement \`go_long()\` and/or \`go_short()\` methods
- Indicators: Use Jesse's built-in indicators like \`utils.rsi()\`, \`utils.sma()\`, \`utils.ema()\`, etc.
- Order placement: Use \`self.buy = qty, price\` and \`self.sell = qty, price\`
- Risk management: Use \`self.stop_loss = qty, price\` and \`self.take_profit = qty, price\`
- Quantity calculation: Use \`utils.size_to_qty(self.capital, self.price, risk_percentage)\`

Jesse Strategy Structure:
\`\`\`python
import jesse.strategies as strategies
from jesse import utils

class GeneratedStrategy(strategies.Strategy):
    @property
    def dna(self):
        return [
            {'name': 'param_name', 'type': int, 'min': min_val, 'max': max_val},
            # ... more parameters
        ]

    def setup(self):
        self.param_name = self.hp[0]  # Access DNA parameters by index
        # Initialize other parameters

    def should_long(self):
        # Entry condition logic
        return condition

    def should_short(self):
        # Entry condition logic
        return condition

    def go_long(self):
        qty = utils.size_to_qty(self.capital, self.price, 3)  # 3% risk per trade
        self.buy = qty, self.price
        # Optional risk management
        self.stop_loss = qty, self.price * 0.95
        self.take_profit = qty, self.price * 1.10

    def go_short(self):
        qty = utils.size_to_qty(self.capital, self.price, 3)
        self.sell = qty, self.price
        self.stop_loss = qty, self.price * 1.05
        self.take_profit = qty, self.price * 0.90

    def should_cancel_entry(self):
        return False
\`\`\`

Common Jesse Indicators:
- \`utils.rsi(candles, period)\` - Relative Strength Index
- \`utils.sma(candles, period)\` - Simple Moving Average
- \`utils.ema(candles, period)\` - Exponential Moving Average
- \`utils.macd(candles)\` - MACD indicator
- \`utils.bollinger_bands(candles, period, std_dev)\` - Bollinger Bands
- \`utils.stoch(candles, k_period, d_period)\` - Stochastic Oscillator

Strategy Description: {{{strategyDescription}}}

{{#if existingCode}}
Existing Code to Reference/Modify: {{{existingCode}}}
{{/if}}

Generate complete, runnable Jesse strategy code that implements the described trading logic. Include appropriate DNA parameters for optimization.`,
});

const aiStrategyGeneratorFlow = ai.defineFlow(
  {
    name: 'aiStrategyGeneratorFlow',
    inputSchema: AiStrategyGeneratorInputSchema,
    outputSchema: AiStrategyGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await aiStrategyGeneratorPrompt(input);
    return output!;
  }
);
