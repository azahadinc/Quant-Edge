import { NextRequest, NextResponse } from 'next/server';
import { TradingService, TradeConfig } from '@/services/trading-service';
import { botManager } from '@/services/live-bot-monitor';

/**
 * POST /api/live/register-trade - Register a manual trade as a bot for tracking
 * This allows users placing direct trades to see them tracked in the Active Bots panel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[REGISTER-TRADE] Received request:', body);

    const {
      orderId,
      symbol,
      quantity,
      side,
      exchange,
      mode,
      alpacaKeyId,
      alpacaSecretKey,
      binanceApiKey,
      binanceApiSecret,
    } = body;

    // Validate required fields
    if (!orderId || !symbol || !exchange || !mode) {
      console.warn('[REGISTER-TRADE] Missing required fields:', { orderId, symbol, exchange, mode });
      return NextResponse.json(
        { error: 'Missing required fields: orderId, symbol, exchange, mode' },
        { status: 400 }
      );
    }

    // Create a bot ID from the order + symbol + timestamp
    const botId = `trade-${exchange}-${symbol}-${orderId}`;
    console.log('[REGISTER-TRADE] Creating bot with ID:', botId);

    // Check if bot already exists
    if (botManager.getBot(botId)) {
      console.warn('[REGISTER-TRADE] Bot already exists:', botId);
      return NextResponse.json(
        { error: `Trade ${botId} already being tracked` },
        { status: 409 }
      );
    }

    // Create trading service
    const tradeConfig: TradeConfig = {
      exchange: exchange as 'alpaca' | 'binance',
      alpacaKeyId,
      alpacaSecretKey,
      alpacaPaper: mode === 'PAPER',
      binanceApiKey,
      binanceApiSecret,
    };

    const trading = new TradingService(tradeConfig);
    console.log('[REGISTER-TRADE] TradingService created for:', exchange);

    // Register bot for this trade
    // Strategy is "Manual: SYMBOL SIDE"
    const strategy = `Manual: ${symbol} ${side?.toUpperCase() || 'TRADE'}`;
    const bot = botManager.registerBot(
      botId,
      trading,
      strategy,
      mode as 'PAPER' | 'LIVE'
    );
    console.log('[REGISTER-TRADE] Bot registered:', botId);

    // Start the bot to begin tracking
    await bot.start();
    console.log('[REGISTER-TRADE] Bot started:', botId);

    const status = await bot.getStatus();
    console.log('[REGISTER-TRADE] Bot status retrieved:', {
      botId,
      strategy: status.strategy,
      exchange: status.exchange,
      status: status.status,
    });

    // Verify bot was added to manager
    const allBots = botManager.getAllBots();
    console.log('[REGISTER-TRADE] Total bots in manager:', allBots.size);

    return NextResponse.json({
      success: true,
      message: `Trade registered for tracking: ${botId}`,
      botId,
      bot: status,
    });
  } catch (error: any) {
    console.error('[REGISTER-TRADE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to register trade', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
