'use server';

import Alpaca from '@alpacahq/alpaca-trade-api';

/**
 * Server Action to interface with Alpaca Markets SDK.
 * This keeps API credentials off the client.
 */

interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  paper?: boolean;
}

export async function getAlpacaAccountDetails(config: AlpacaConfig) {
  try {
    const alpaca = new Alpaca({
      keyId: config.keyId,
      secretKey: config.secretKey,
      paper: config.paper ?? true,
    });

    const account = await alpaca.getAccount();
    return { 
      success: true, 
      status: account.status, 
      buyingPower: account.buying_power,
      cash: account.cash,
      portfolioValue: account.portfolio_value,
      equity: account.equity,
      currency: account.currency,
      daytradingBuyingPower: account.daytrading_buying_power
    };
  } catch (error: any) {
    console.error("Alpaca Account Error:", error);
    return { success: false, error: error.message };
  }
}

export async function testAlpacaConnection(config: AlpacaConfig) {
  try {
    const alpaca = new Alpaca({
      keyId: config.keyId,
      secretKey: config.secretKey,
      paper: config.paper ?? true,
    });

    const account = await alpaca.getAccount();
    return { success: true, status: account.status, buyingPower: account.buying_power };
  } catch (error: any) {
    console.error("Alpaca Connection Error:", error);
    return { success: false, error: error.message };
  }
}

export async function placeAlpacaOrder(params: {
  config: AlpacaConfig;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
}) {
  try {
    const alpaca = new Alpaca({
      keyId: params.config.keyId,
      secretKey: params.config.secretKey,
      paper: params.config.paper ?? true,
    });

    // Normalize symbol for Alpaca
    // Crypto: BTC/USDT -> BTCUSD
    // Stocks: AAPL -> AAPL
    let symbol = params.symbol.toUpperCase().replace(/\s+/g, '');
    symbol = symbol.replace('/USDT', '/USD');
    symbol = symbol.replace('/', '');

    const order = await alpaca.createOrder({
      symbol: symbol,
      qty: params.qty,
      side: params.side,
      type: params.type,
      time_in_force: 'gtc',
    });

    return { 
      success: true, 
      orderId: order.id, 
      status: order.status,
      symbol: order.symbol,
      qty: order.qty,
      filled_qty: order.filled_qty
    };
  } catch (error: any) {
    console.error("Alpaca Order Error:", error);
    return { success: false, error: error.message || "Unknown Alpaca Error" };
  }
}

export async function closeAlpacaPosition(params: {
  config: AlpacaConfig;
  symbol: string;
}) {
  try {
    const alpaca = new Alpaca({
      keyId: params.config.keyId,
      secretKey: params.config.secretKey,
      paper: params.config.paper ?? true,
    });

    // Normalize symbol for closing
    let symbol = params.symbol.toUpperCase().replace(/\s+/g, '');
    symbol = symbol.replace('/USDT', '/USD');
    symbol = symbol.replace('/', '');

    await alpaca.closePosition(symbol);
    return { success: true };
  } catch (error: any) {
    console.error("Alpaca Close Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAlpacaPositions(config: AlpacaConfig) {
  try {
    const alpaca = new Alpaca({
      keyId: config.keyId,
      secretKey: config.secretKey,
      paper: config.paper ?? true,
    });

    const positions = await alpaca.getPositions();
    const normalized = positions.map((pos: any) => ({
      symbol: pos.symbol,
      qty: parseFloat(pos.qty),
      side: pos.side,
      avgEntryPrice: parseFloat(pos.avg_entry_price),
      marketValue: parseFloat(pos.market_value),
      costBasis: parseFloat(pos.cost_basis),
      unrealizedPl: parseFloat(pos.unrealized_pl),
      unrealizedPlPc: parseFloat(pos.unrealized_plpc),
      currentPrice: parseFloat(pos.current_price),
      exchange: pos.exchange,
      assetClass: pos.asset_class,
    }));

    return { success: true, positions: normalized };
  } catch (error: any) {
    console.error('Alpaca Positions Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getAlpacaHistoricalBars(params: {
  config: AlpacaConfig;
  symbol: string;
  start: string;
  end: string;
  timeframe: string;
}) {
  try {
    const alpaca = new Alpaca({
      keyId: params.config.keyId,
      secretKey: params.config.secretKey,
      paper: params.config.paper ?? true,
    });

    let symbol = params.symbol.toUpperCase().replace('/', '');
    if (symbol === 'BTCUSDT') symbol = 'BTCUSD';

    const bars = alpaca.getBarsV2(
      symbol,
      {
        start: params.start,
        end: params.end,
        timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.HOUR),
        limit: 1000,
      }
    );

    const result = [];
    for await (const b of bars) {
      result.push({
        t: b.Timestamp,
        o: b.OpenPrice,
        h: b.HighPrice,
        l: b.LowPrice,
        c: b.ClosePrice,
        v: b.Volume,
      });
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Alpaca History Error:", error);
    return { success: false, error: error.message };
  }
}
