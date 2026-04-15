import { NextRequest, NextResponse } from 'next/server';
import { jesseService } from '@/services/jesse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      strategyName,
      startDate,
      endDate,
      initialCapital = 10000,
      hyperparameters,
      exchange = 'binance',
      symbol = 'BTC-USDT',
      timeframe = '1h'
    } = body;

    if (!strategyName || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: strategyName, startDate, endDate' },
        { status: 400 }
      );
    }

    // Run Jesse backtest
    console.log('Starting Jesse backtest for:', { strategyName, startDate, endDate });
    const result = await jesseService.runBacktest({
      strategyName,
      startDate,
      endDate,
      initialCapital,
      hyperparameters,
      exchange,
      symbol,
      timeframe
    });

    console.log('Jesse backtest result:', result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Jesse backtest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}