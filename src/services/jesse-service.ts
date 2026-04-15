import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { EventEmitter } from 'events';

export interface BacktestConfig {
  strategyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  hyperparameters?: Record<string, any>;
  exchange?: string;
  symbol?: string;
  timeframe?: string;
}

export interface BacktestResult {
  totalReturn: number;
  maxDrawdown: number;
  profitFactor: number;
  winRate: number;
  totalTrades: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  trades: Array<{
    id: string;
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    profit: number;
    entryTime: string;
    exitTime: string;
  }>;
  metrics: Record<string, any>;
}

export interface StrategyInfo {
  name: string;
  dna: Array<{
    name: string;
    type: string;
    min: number;
    max: number;
  }>;
  code: string;
}

export class JesseService extends EventEmitter {
  private jessePath: string;
  private pythonPath: string;

  constructor() {
    super();
    this.jessePath = path.join(process.cwd(), 'src', 'jesse');
    // Use virtual environment Python
    this.pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');
  }

  /**
   * Run a backtest using Jesse
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    return new Promise((resolve, reject) => {
      // Create a Python script to run the backtest
      const pythonScript = `
import sys
import os
import json
sys.path.insert(0, '${this.jessePath}')

# Mock backtest result for now
result = {
    "metrics": {
        "net_profit_percentage": 5.2,
        "total": 520,
        "win_rate": 0.65,
        "max_drawdown": 0.08,
        "total_trades": 12,
        "profit_factor": 1.8
    },
    "trades": [
        {
            "id": "trade_1",
            "type": "long",
            "entry_price": 51000,
            "exit_price": 52500,
            "profit": 150,
            "entry_time": "2023-01-01T10:00:00Z",
            "exit_time": "2023-01-02T10:00:00Z"
        }
    ]
}

print(json.dumps(result))
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', pythonScript], {
        cwd: this.jessePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: this.jessePath
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        this.emit('progress', chunk);
      });

      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        this.emit('error', chunk);
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code: ${code}`);
        console.log(`Output: ${output}`);
        console.log(`Error output: ${errorOutput}`);

        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(this.parseJesseResult(result));
          } catch (error) {
            reject(new Error(`Failed to parse Jesse output: ${error}. Output: ${output}`));
          }
        } else {
          reject(new Error(`Jesse backtest failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Jesse process: ${error.message}`));
      });
    });
  }

  /**
   * Import Jesse modules dynamically
   */
  private async importJesseModules(): Promise<any> {
    // This will run in the Python process spawned by the API route
    // For now, return mock objects - in production this would need proper Python interop
    return {
      research: {
        backtest: (config: any, routes: any, dataRoutes: any, candles: any) => {
          // Mock backtest result
          return {
            metrics: {
              net_profit_percentage: 5.2,
              total: 520,
              win_rate: 0.65,
              max_drawdown: 0.08,
              total_trades: 12,
              profit_factor: 1.8
            },
            trades: [
              {
                id: 'trade_1',
                type: 'long',
                entry_price: 51000,
                exit_price: 52500,
                profit: 150,
                entry_time: '2023-01-01T10:00:00Z',
                exit_time: '2023-01-02T10:00:00Z'
              }
            ]
          };
        }
      },
      factories: {
        candles_from_close_prices: (prices: number[]) => {
          // Mock candle data
          return prices.map((price, i) => [i, price, price * 1.01, price * 0.99, price, 1000]);
        }
      }
    };
  }

  /**
   * Generate a new strategy file from code
   */
  async createStrategy(name: string, code: string): Promise<void> {
    const strategyPath = path.join(this.jessePath, 'strategies', `${name}.py`);

    // Validate the code contains required Jesse structure
    if (!code.includes('class ') || !code.includes('Strategy')) {
      throw new Error('Invalid strategy code: must contain a Strategy class');
    }

    await fs.writeFile(strategyPath, code, 'utf-8');
  }

  /**
   * List available strategies
   */
  async listStrategies(): Promise<string[]> {
    const strategiesDir = path.join(this.jessePath, 'strategies');

    try {
      const files = await fs.readdir(strategiesDir);
      return files
        .filter(file => file.endsWith('.py') && file !== '__init__.py' && file !== 'base_strategy.py')
        .map(file => file.replace('.py', ''));
    } catch (error) {
      console.error('Error listing strategies:', error);
      return [];
    }
  }

  /**
   * Get strategy information including DNA
   */
  async getStrategyInfo(name: string): Promise<StrategyInfo | null> {
    const strategyPath = path.join(this.jessePath, 'strategies', `${name}.py`);

    try {
      const code = await fs.readFile(strategyPath, 'utf-8');

      // Extract DNA using Python script
      const dna = await this.extractStrategyDNA(name);

      return {
        name,
        dna,
        code
      };
    } catch (error) {
      console.error(`Error getting strategy info for ${name}:`, error);
      return null;
    }
  }

  /**
   * Extract DNA from strategy using Python
   */
  private async extractStrategyDNA(strategyName: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      const script = `
import sys
import os
sys.path.insert(0, '${this.jessePath}')
from strategies.${strategyName} import Strategy

try:
    strategy = Strategy()
    dna = strategy.dna if hasattr(strategy, 'dna') else []
    print(dna)
except Exception as e:
    print("[]", file=sys.stderr)
    sys.exit(1)
`;

      const pythonProcess = spawn(this.pythonPath, ['-c', script], {
        cwd: this.jessePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const dna = JSON.parse(output.trim());
            resolve(dna);
          } catch (error) {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * Parse Jesse backtest result into our format
   */
  private parseJesseResult(jesseResult: any): BacktestResult {
    const metrics = jesseResult.metrics || {};

    return {
      totalReturn: metrics.net_profit_percentage || 0,
      maxDrawdown: metrics.max_drawdown || 0,
      profitFactor: metrics.profit_factor || 0,
      winRate: metrics.win_rate || 0,
      totalTrades: metrics.total_trades || 0,
      sharpeRatio: metrics.sharpe_ratio,
      sortinoRatio: metrics.sortino_ratio,
      calmarRatio: metrics.calmar_ratio,
      trades: (jesseResult.trades || []).map((trade: any, index: number) => ({
        id: trade.id || `trade_${index}`,
        type: trade.type === 'long' ? 'LONG' : 'SHORT',
        entryPrice: trade.entry_price || 0,
        exitPrice: trade.exit_price || 0,
        profit: trade.profit || 0,
        entryTime: trade.entry_time || '',
        exitTime: trade.exit_time || ''
      })),
      metrics: metrics
    };
  }

  /**
   * Optimize strategy hyperparameters
   */
  async optimizeStrategy(
    strategyName: string,
    config: {
      startDate: string;
      endDate: string;
      initialCapital: number;
      generations: number;
      population: number;
    }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [
        '-m', 'jesse',
        'optimize',
        '--strategy', strategyName,
        '--start-date', config.startDate,
        '--finish-date', config.endDate,
        '--initial-capital', config.initialCapital.toString(),
        '--generations', config.generations.toString(),
        '--population', config.population.toString(),
        '--json'
      ];

      const pythonProcess = spawn(this.pythonPath, args, {
        cwd: this.jessePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse optimization output: ${error}`));
          }
        } else {
          reject(new Error(`Jesse optimization failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * Validate strategy code
   */
  async validateStrategy(code: string): Promise<{ valid: boolean; errors: string[] }> {
    // Basic validation - check for required Jesse structure
    const errors: string[] = [];

    if (!code.includes('import jesse.strategies as strategies')) {
      errors.push('Missing Jesse strategies import');
    }

    if (!code.includes('class ') || !code.includes('Strategy')) {
      errors.push('Strategy class not found');
    }

    if (!code.includes('should_long') && !code.includes('should_short')) {
      errors.push('No entry conditions defined (should_long or should_short)');
    }

    if (!code.includes('go_long') && !code.includes('go_short')) {
      errors.push('No position execution methods defined (go_long or go_short)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const jesseService = new JesseService();