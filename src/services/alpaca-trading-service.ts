import axios from 'axios';

/**
 * Service for Alpaca paper trading integration
 * Handles account management, order placement, and position tracking
 */

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  last_equity: number;
  multiplier: string;
  daytrading_buying_power: number;
  regt_buying_power: number;
  accrued_fees: number;
  pending_transfer_in: number;
  pending_transfer_out: number;
  long_market_value: number;
  short_market_value: number;
  created_at: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  avg_fill_price: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  unrealized_gain: string;
  unrealized_gain_pct: string;
  unrealized_intraday_gain: string;
  unrealized_intraday_gain_pct: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  change_today_pct: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_by_order_id?: string;
  replaces_order_id?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours: boolean;
  legs?: AlpacaOrder[];
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
}

export class AlpacaService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private isLive: boolean;

  constructor(apiKey: string, apiSecret: string, isLive: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isLive = isLive;
    this.baseUrl = isLive 
      ? 'https://api.alpaca.markets'
      : 'https://paper-api.alpaca.markets';
  }

  /**
   * Get account details
   */
  async getAccount(): Promise<AlpacaAccount> {
    try {
      const response = await axios.get<AlpacaAccount>(`${this.baseUrl}/v2/account`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.apiSecret,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Alpaca account:', error);
      throw error;
    }
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      const response = await axios.get<AlpacaPosition[]>(`${this.baseUrl}/v2/positions`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.apiSecret,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Alpaca positions:', error);
      throw error;
    }
  }

  /**
   * Get specific position
   */
  async getPosition(symbol: string): Promise<AlpacaPosition> {
    try {
      const response = await axios.get<AlpacaPosition>(`${this.baseUrl}/v2/positions/${symbol}`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.apiSecret,
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Alpaca position for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(
    symbol: string,
    qty: number,
    side: 'buy' | 'sell'
  ): Promise<AlpacaOrder> {
    try {
      const response = await axios.post<AlpacaOrder>(
        `${this.baseUrl}/v2/orders`,
        {
          symbol,
          qty,
          side,
          type: 'market',
          time_in_force: 'day'
        },
        {
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.apiSecret,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error placing market order for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    symbol: string,
    qty: number,
    side: 'buy' | 'sell',
    limitPrice: number,
    stopPrice?: number
  ): Promise<AlpacaOrder> {
    try {
      const orderData: any = {
        symbol,
        qty,
        side,
        type: stopPrice ? 'stop_limit' : 'limit',
        time_in_force: 'day',
        limit_price: limitPrice
      };

      if (stopPrice) {
        orderData.stop_price = stopPrice;
      }

      const response = await axios.post<AlpacaOrder>(
        `${this.baseUrl}/v2/orders`,
        orderData,
        {
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.apiSecret,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error placing limit order for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, qty?: number): Promise<AlpacaOrder> {
    try {
      const response = await axios.delete<AlpacaOrder>(
        `${this.baseUrl}/v2/positions/${symbol}`,
        {
          data: qty ? { qty } : {},
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.apiSecret,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error closing position for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/v2/orders/${orderId}`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.apiSecret,
        }
      });
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    try {
      const response = await axios.get<AlpacaOrder>(
        `${this.baseUrl}/v2/orders/${orderId}`,
        {
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.apiSecret,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getOrders(status?: string): Promise<AlpacaOrder[]> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get<AlpacaOrder[]>(
        `${this.baseUrl}/v2/orders`,
        {
          params,
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.apiSecret,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error('Alpaca connection test failed:', error);
      return false;
    }
  }
}

/**
 * Get Alpaca service instance from environment variables
 */
export function getAlpacaService(isPaper: boolean = true): AlpacaService {
  const apiKey = process.env.NEXT_PUBLIC_ALPACA_API_KEY || process.env.ALPACA_API_KEY || '';
  const apiSecret = process.env.ALPACA_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    throw new Error('Alpaca API credentials not configured');
  }

  return new AlpacaService(apiKey, apiSecret, !isPaper);
}
