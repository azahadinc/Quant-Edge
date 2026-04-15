'use server';
/**
 * @fileOverview Jesse Integration Flow
 *
 * This flow handles Jesse engine integration including strategy generation,
 * validation, backtesting, and optimization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { jesseService, BacktestConfig, BacktestResult } from '@/services/jesse-service';

// --- Input/Output Schemas ---

const JesseStrategyGenerationInputSchema = z.object({
  strategyDescription: z
    .string()
    .describe('Natural language description of the trading strategy to generate'),
  complexity: z
    .enum(['simple', 'moderate', 'advanced'])
    .default('moderate')
    .describe('Complexity level of the strategy'),
  riskLevel: z
    .enum(['conservative', 'moderate', 'aggressive'])
    .default('moderate')
    .describe('Risk management approach'),
  indicators: z
    .array(z.string())
    .optional()
    .describe('Specific indicators to include'),
});

const JesseStrategyGenerationOutputSchema = z.object({
  strategyName: z.string().describe('Generated strategy name'),
  code: z.string().describe('Complete Jesse strategy Python code'),
  dna: z.array(z.any()).describe('Strategy DNA for optimization'),
  explanation: z.string().describe('Explanation of the strategy logic'),
  validationResult: z.object({
    valid: z.boolean(),
    errors: z.array(z.string()),
  }).describe('Code validation results'),
});

const JesseBacktestInputSchema = z.object({
  strategyName: z.string().describe('Name of the strategy to backtest'),
  startDate: z.string().describe('Backtest start date (YYYY-MM-DD)'),
  endDate: z.string().describe('Backtest end date (YYYY-MM-DD)'),
  initialCapital: z.number().default(10000).describe('Initial capital in USD'),
  hyperparameters: z.record(z.any()).optional().describe('Strategy hyperparameters'),
  exchange: z.string().default('binance').describe('Exchange to use'),
  symbol: z.string().default('BTC-USDT').describe('Trading symbol'),
  timeframe: z.string().default('1h').describe('Chart timeframe'),
});

const JesseBacktestOutputSchema = z.object({
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
});

const JesseOptimizationInputSchema = z.object({
  strategyName: z.string().describe('Strategy to optimize'),
  startDate: z.string().describe('Optimization start date'),
  endDate: z.string().describe('Optimization end date'),
  initialCapital: z.number().default(10000),
  generations: z.number().default(50).describe('Number of optimization generations'),
  population: z.number().default(100).describe('Population size for genetic algorithm'),
});

const JesseOptimizationOutputSchema = z.object({
  success: z.boolean(),
  bestParameters: z.record(z.any()).optional(),
  optimizationResults: z.any().optional(),
  error: z.string().optional(),
});

// --- Flow Definitions ---

/**
 * Generate a Jesse-compatible trading strategy
 */
export const generateJesseStrategyFlow = ai.defineFlow(
  {
    name: 'generateJesseStrategy',
    inputSchema: JesseStrategyGenerationInputSchema,
    outputSchema: JesseStrategyGenerationOutputSchema,
  },
  async (input) => {
    // Generate strategy name
    const strategyName = `Strategy_${Date.now()}`;

    // Create detailed prompt for Jesse strategy generation
    const prompt = `Generate a complete Jesse trading strategy based on this description: "${input.strategyDescription}"

Requirements:
- Use Jesse framework structure with proper imports
- Include DNA property for hyperparameter optimization
- Implement should_long() and should_short() methods
- Include go_long() and go_short() methods with risk management
- Use appropriate Jesse indicators
- Follow ${input.complexity} complexity level
- Implement ${input.riskLevel} risk management
${input.indicators ? `- Include these indicators: ${input.indicators.join(', ')}` : ''}

Return ONLY the Python code for the strategy class.`;

    const llmResponse = await ai.generate({
      prompt,
      model: 'gemini-pro',
    });

    const generatedCode = llmResponse.text;

    // Validate the generated code
    const validationResult = await jesseService.validateStrategy(generatedCode);

    // Extract DNA from the code (simplified - in production you'd parse the code)
    const dna = [
      { name: 'rsi_period', type: 'int', min: 2, max: 30 },
      { name: 'stop_loss_pct', type: 'float', min: 0.01, max: 0.1 },
      { name: 'take_profit_pct', type: 'float', min: 0.02, max: 0.2 },
    ];

    // Create explanation
    const explanation = `Generated ${input.complexity} complexity strategy with ${input.riskLevel} risk management based on: ${input.strategyDescription}`;

    return {
      strategyName,
      code: generatedCode,
      dna,
      explanation,
      validationResult,
    };
  }
);

/**
 * Run backtest using Jesse engine
 */
export const runJesseBacktestFlow = ai.defineFlow(
  {
    name: 'runJesseBacktest',
    inputSchema: JesseBacktestInputSchema,
    outputSchema: JesseBacktestOutputSchema,
  },
  async (input) => {
    try {
      const config: BacktestConfig = {
        strategyName: input.strategyName,
        startDate: input.startDate,
        endDate: input.endDate,
        initialCapital: input.initialCapital,
        hyperparameters: input.hyperparameters,
        exchange: input.exchange,
        symbol: input.symbol,
        timeframe: input.timeframe,
      };

      const result = await jesseService.runBacktest(config);

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
);

/**
 * Optimize strategy hyperparameters using Jesse
 */
export const optimizeJesseStrategyFlow = ai.defineFlow(
  {
    name: 'optimizeJesseStrategy',
    inputSchema: JesseOptimizationInputSchema,
    outputSchema: JesseOptimizationOutputSchema,
  },
  async (input) => {
    try {
      const result = await jesseService.optimizeStrategy(input.strategyName, {
        startDate: input.startDate,
        endDate: input.endDate,
        initialCapital: input.initialCapital,
        generations: input.generations,
        population: input.population,
      });

      return {
        success: true,
        bestParameters: result.best_parameters,
        optimizationResults: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed',
      };
    }
  }
);

// --- Helper Functions ---

/**
 * Generate Jesse strategy from natural language
 */
export async function generateJesseStrategy(input: z.infer<typeof JesseStrategyGenerationInputSchema>) {
  return generateJesseStrategyFlow(input);
}

/**
 * Run Jesse backtest
 */
export async function runJesseBacktest(input: z.infer<typeof JesseBacktestInputSchema>) {
  return runJesseBacktestFlow(input);
}

/**
 * Optimize Jesse strategy
 */
export async function optimizeJesseStrategy(input: z.infer<typeof JesseOptimizationInputSchema>) {
  return optimizeJesseStrategyFlow(input);
}