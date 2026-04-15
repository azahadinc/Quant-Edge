import { jesseService } from './src/services/jesse-service';

async function testJesseService() {
  try {
    console.log('Testing Jesse service...');

    // Test listing strategies
    const strategies = await jesseService.listStrategies();
    console.log('Available strategies:', strategies);

    if (strategies.length === 0) {
      console.log('No strategies found, creating test strategy...');
      await jesseService.createStrategy('test_strategy', `
import jesse.strategies as strategies
from jesse import utils

class TestStrategy(strategies.Strategy):
    @property
    def dna(self):
        return [
            {'name': 'rsi_period', 'type': int, 'min': 2, 'max': 30}
        ]

    def setup(self):
        self.rsi_period = self.hp[0]

    def should_long(self):
        return True

    def go_long(self):
        qty = utils.size_to_qty(self.capital * 0.1, self.price)
        self.buy = qty, self.price
`);
    }

    // Test backtest
    console.log('Running backtest...');
    const result = await jesseService.runBacktest({
      strategyName: strategies[0] || 'test_strategy',
      startDate: '2023-01-01',
      endDate: '2023-01-10',
      initialCapital: 10000,
      exchange: 'binance',
      symbol: 'BTC-USDT',
      timeframe: '1h'
    });

    console.log('Backtest result:', result);

  } catch (error) {
    console.error('Jesse service test failed:', error);
  }
}

testJesseService();