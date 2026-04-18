import crypto from 'crypto';

/**
 * Service for Binance paper trading integration
 * Uses Binance testnet for paper trading
 */

export interface BinanceAccount {
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
  totalAssetOfBtc: string;
}

export interface BinancePosition {
  symbol: string;
  positionAmt: string;
  initialMargin: string;
  maintMargin: string;
  unrealizedProfit: string;
  realizedProfit: string;
  percentage: string;
  markPrice: string;
  liquidationPrice: string;
  collateralRate: string;
  notional: string;
  marginRatio: string;
  index_price: string;
  isolated: boolean;
  updateTime: number;
}

export interface BinanceOrder {
  orderId: number;
  symbol: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  price: string;
  stopPrice: string;
  iceBergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceTicker {
  symbol: string;
  price: string;
}

export class BinanceService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private isPaper: boolean;

  constructor(apiKey: string, apiSecret: string, isPaper: boolean = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isPaper = isPaper;
    this.baseUrl = isPaper
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  /**
   * Generate request signature
   */
  private generateSignature(params: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(params)
      .digest('hex');
  }

  /**
   * Make signed request
   */
  private async request(
    method: string,
    endpoint: string,
    params: Record<string, any> = {},
    needsSignature: boolean = true
  ): Promise<any> {
    const timestamp = Date.now();
    const defaultParams = needsSignature ? { timestamp } : {};
    const mergedParams = { ...defaultParams, ...params };

    let url = `${this.baseUrl}${endpoint}?`;
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(mergedParams)) {
      queryParams.append(key, String(value));
    }

    const paramsString = queryParams.toString();

    if (needsSignature) {
      const signature = this.generateSignature(paramsString);
      queryParams.append('signature', signature);
    }

    url += queryParams.toString();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Binance request error: ${error}`);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<BinanceAccount> {
    return this.request('GET', '/v3/account', {}, true);
  }

  /**
   * Get all open orders
   */
  async getOpenOrders(symbol?: string): Promise<BinanceOrder[]> {
    const params = symbol ? { symbol } : {};
    return this.request('GET', '/v3/openOrders', params, true);
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol: string, limit: number = 500): Promise<BinanceOrder[]> {
    return this.request('GET', '/v3/allOrders', { symbol, limit }, true);
  }

  /**
   * Get account balance
   */
  async getBalance(asset: string): Promise<string> {
    const account = await this.getAccount();
    const balance = account.balances.find(b => b.asset === asset);
    return balance?.free || '0';
  }

  /**
   * Place market order
   */
  async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
  ): Promise<BinanceOrder> {
    return this.request('POST', '/v3/order', {
      symbol,
      side,
      type: 'MARKET',
      quantity
    }, true);
  }

  /**
   * Place limit order
   */
  async placeLimitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    timeInForce: string = 'GTC'
  ): Promise<BinanceOrder> {
    return this.request('POST', '/v3/order', {
      symbol,
      side,
      type: 'LIMIT',
      timeInForce,
      quantity,
      price
    }, true);
  }

  /**
   * Cancel order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<BinanceOrder> {
    return this.request('DELETE', '/v3/order', {
      symbol,
      orderId
    }, true);
  }

  /**
   * Get current price
   */
  async getPrice(symbol: string): Promise<string> {
    const response = await this.request(
      'GET',
      '/v3/ticker/price',
      { symbol },
      false
    );
    return response.price;
  }

  /**
   * Get multiple prices
   */
  async getPrices(symbols: string[]): Promise<BinanceTicker[]> {
    const response = await this.request(
      'GET',
      '/v3/ticker/price',
      { symbols: JSON.stringify(symbols) },
      false
    );
    return Array.isArray(response) ? response : [response];
  }

  /**
   * Get 24h ticker statistics
   */
  async getTicker24h(symbol: string): Promise<any> {
    return this.request(
      'GET',
      '/v3/ticker/24hr',
      { symbol },
      false
    );
  }

  /**
   * Get klines (candlestick data)
   */
  async getKlines(
    symbol: string,
    interval: string,
    limit: number = 500
  ): Promise<any[]> {
    return this.request(
      'GET',
      '/v3/klines',
      { symbol, interval, limit },
      false
    );
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error('Binance connection test failed:', error);
      return false;
    }
  }

  /**
   * Get portfolio value in USD equivalent
   */
  async getPortfolioValue(): Promise<number> {
    try {
      const account = await this.getAccount();
      const btcPrice = await this.getPrice('BTCUSDT');
      let totalValue = 0;

      for (const balance of account.balances) {
        const free = parseFloat(balance.free);
        if (free > 0) {
          if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
            totalValue += free;
          } else if (balance.asset === 'BTC') {
            totalValue += free * parseFloat(btcPrice);
          } else {
            // Try to get price for other assets
            try {
              const price = await this.getPrice(`${balance.asset}USDT`);
              totalValue += free * parseFloat(price);
            } catch {
              // Skip if price unavailable
            }
          }
        }
      }
      return totalValue;
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return 0;
    }
  }
}

/**
 * Get Binance service instance from environment variables
 */
export function getBinanceService(isPaper: boolean = true): BinanceService {
  const apiKey = process.env.NEXT_PUBLIC_BINANCE_API_KEY || process.env.BINANCE_API_KEY || '';
  const apiSecret = process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    throw new Error('Binance API credentials not configured');
  }

  return new BinanceService(apiKey, apiSecret, isPaper);
}
