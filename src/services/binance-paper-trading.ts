import Binance from 'binance-api-node'

export interface BinancePaperPosition {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  commission: number
  openTime: Date
}

export interface BinancePaperOrder {
  orderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED'
  createdAt: Date
  filledAt?: Date
}

export interface BinancePaperAccount {
  walletBalance: number
  totalBalance: number
  freeBalance: number
  positions: BinancePaperPosition[]
  orders: BinancePaperOrder[]
  commissionRate: number
  totalPnL: number
  totalPnLPercent: number
}

/**
 * Binance Paper Trading Service
 * Provides a simulated trading environment for Binance without using real funds
 * 
 * This service maintains a virtual account with:
 * - Virtual wallet with configurable starting balance
 * - Position tracking with real-time P&L calculation
 * - Order execution with simulated fill prices
 * - Commission simulation
 */
export class BinancePaperTradingService {
  private apiKey: string
  private apiSecret: string
  private client: any // Binance client
  private virtualAccount: BinancePaperAccount
  private priceCache: Map<string, number> = new Map()
  private updateInterval: NodeJS.Timer | null = null

  constructor(apiKey: string, apiSecret: string, initialBalance: number = 10000) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret

    // Initialize Binance client (for market data only in paper trading)
    try {
      this.client = Binance({
        apiKey: apiKey,
        apiSecret: apiSecret,
      })
    } catch (error) {
      console.warn('Binance client initialization failed:', error)
    }

    // Initialize virtual account
    this.virtualAccount = {
      walletBalance: initialBalance,
      totalBalance: initialBalance,
      freeBalance: initialBalance,
      positions: [],
      orders: [],
      commissionRate: 0.001, // 0.1% commission
      totalPnL: 0,
      totalPnLPercent: 0,
    }

    // Start updating prices
    this.startPriceUpdates()
  }

  /**
   * Start periodic price updates from Binance market data
   */
  private startPriceUpdates(): void {
    this.updateInterval = setInterval(async () => {
      if (this.virtualAccount.positions.length === 0) return

      try {
        for (const position of this.virtualAccount.positions) {
          const price = await this.getLastPrice(position.symbol)
          if (price) {
            this.priceCache.set(position.symbol, price)
            position.currentPrice = price

            // Update P&L
            if (position.side === 'BUY') {
              position.unrealizedPnL = (price - position.entryPrice) * position.quantity
            } else {
              position.unrealizedPnL = (position.entryPrice - price) * position.quantity
            }
            position.unrealizedPnLPercent = (position.unrealizedPnL / (position.entryPrice * position.quantity)) * 100
          }
        }

        // Update account totals
        this.updateAccountTotals()
      } catch (error) {
        console.error('Error updating prices:', error)
      }
    }, 5000) // Update every 5 seconds
  }

  /**
   * Stop price updates
   */
  stopPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Get the last price for a symbol from Binance
   */
  async getLastPrice(symbol: string): Promise<number> {
    try {
      // Check cache first
      if (this.priceCache.has(symbol)) {
        return this.priceCache.get(symbol)!
      }

      // Otherwise, this would call Binance API
      // For now, return a simulated price
      const basePrice = Math.random() * 100 + 50 // Mock price between 50-150
      this.priceCache.set(symbol, basePrice)
      return basePrice
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error)
      return 0
    }
  }

  /**
   * Get all prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>()

    for (const symbol of symbols) {
      const price = await this.getLastPrice(symbol)
      prices.set(symbol, price)
    }

    return prices
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol: string, quantity: number, price?: number): Promise<BinancePaperOrder> {
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fillPrice = price || (await this.getLastPrice(symbol))

    const order: BinancePaperOrder = {
      orderId,
      symbol,
      side: 'BUY',
      quantity,
      price: fillPrice,
      status: 'PENDING',
      createdAt: new Date(),
    }

    this.virtualAccount.orders.push(order)

    // Simulate immediate fill
    this.fillOrder(orderId, fillPrice)

    return order
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol: string, quantity: number, price?: number): Promise<BinancePaperOrder> {
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fillPrice = price || (await this.getLastPrice(symbol))

    // Check if we have the position
    const position = this.virtualAccount.positions.find(
      (p) => p.symbol === symbol && p.side === 'BUY'
    )

    if (!position || position.quantity < quantity) {
      return {
        orderId,
        symbol,
        side: 'SELL',
        quantity,
        price: fillPrice,
        status: 'REJECTED',
        createdAt: new Date(),
      }
    }

    const order: BinancePaperOrder = {
      orderId,
      symbol,
      side: 'SELL',
      quantity,
      price: fillPrice,
      status: 'PENDING',
      createdAt: new Date(),
    }

    this.virtualAccount.orders.push(order)

    // Simulate immediate fill
    this.fillOrder(orderId, fillPrice)

    return order
  }

  /**
   * Fill an order (internal method)
   */
  private fillOrder(orderId: string, fillPrice: number): void {
    const order = this.virtualAccount.orders.find((o) => o.orderId === orderId)
    if (!order) return

    const commission = order.quantity * fillPrice * this.virtualAccount.commissionRate

    if (order.side === 'BUY') {
      // Check if we have enough balance
      const cost = order.quantity * fillPrice + commission
      if (cost > this.virtualAccount.freeBalance) {
        order.status = 'REJECTED'
        return
      }

      // Reduce balance
      this.virtualAccount.freeBalance -= cost
      this.virtualAccount.walletBalance -= cost

      // Add or update position
      const existingPosition = this.virtualAccount.positions.find(
        (p) => p.symbol === order.symbol && p.side === 'BUY'
      )

      if (existingPosition) {
        const totalCost = existingPosition.entryPrice * existingPosition.quantity + fillPrice * order.quantity
        const totalQuantity = existingPosition.quantity + order.quantity
        existingPosition.entryPrice = totalCost / totalQuantity
        existingPosition.quantity = totalQuantity
      } else {
        this.virtualAccount.positions.push({
          symbol: order.symbol,
          side: 'BUY',
          quantity: order.quantity,
          entryPrice: fillPrice,
          currentPrice: fillPrice,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          commission,
          openTime: new Date(),
        })
      }
    } else {
      // SELL
      const position = this.virtualAccount.positions.find(
        (p) => p.symbol === order.symbol && p.side === 'BUY'
      )

      if (position && position.quantity >= order.quantity) {
        // Calculate P&L
        const pnl = (fillPrice - position.entryPrice) * order.quantity
        const proceeds = order.quantity * fillPrice - commission

        // Reduce or remove position
        position.quantity -= order.quantity
        if (position.quantity === 0) {
          this.virtualAccount.positions = this.virtualAccount.positions.filter((p) => p !== position)
        }

        // Add proceeds back to balance
        this.virtualAccount.freeBalance += proceeds
        this.virtualAccount.walletBalance += pnl
      } else {
        order.status = 'REJECTED'
        return
      }
    }

    order.status = 'FILLED'
    order.filledAt = new Date()
    this.updateAccountTotals()
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    const order = this.virtualAccount.orders.find((o) => o.orderId === orderId)
    if (order && order.status === 'PENDING') {
      order.status = 'CANCELLED'
    }
  }

  /**
   * Update account totals (total P&L, etc.)
   */
  private updateAccountTotals(): void {
    let totalUnrealized = 0
    for (const position of this.virtualAccount.positions) {
      totalUnrealized += position.unrealizedPnL
    }

    this.virtualAccount.totalBalance = this.virtualAccount.walletBalance + totalUnrealized
    this.virtualAccount.totalPnL = this.virtualAccount.totalBalance - this.virtualAccount.freeBalance
    this.virtualAccount.totalPnLPercent = ((this.virtualAccount.totalBalance - this.virtualAccount.freeBalance) / this.virtualAccount.freeBalance) * 100
  }

  /**
   * Get account status
   */
  getAccount(): BinancePaperAccount {
    return this.virtualAccount
  }

  /**
   * Get all positions
   */
  getPositions(): BinancePaperPosition[] {
    return this.virtualAccount.positions
  }

  /**
   * Get a specific position
   */
  getPosition(symbol: string): BinancePaperPosition | undefined {
    return this.virtualAccount.positions.find(
      (p) => p.symbol === symbol && p.side === 'BUY'
    )
  }

  /**
   * Get all orders
   */
  getOrders(): BinancePaperOrder[] {
    return this.virtualAccount.orders
  }

  /**
   * Get wallet balance
   */
  getWalletBalance(): number {
    return this.virtualAccount.walletBalance
  }

  /**
   * Get available balance
   */
  getAvailableBalance(): number {
    return this.virtualAccount.freeBalance
  }

  /**
   * Get total P&L
   */
  getTotalPnL(): { value: number; percent: number } {
    return {
      value: this.virtualAccount.totalPnL,
      percent: this.virtualAccount.totalPnLPercent,
    }
  }

  /**
   * Get account equity
   */
  getEquity(): number {
    return this.virtualAccount.totalBalance
  }

  /**
   * Close all positions (liquidate)
   */
  async liquidateAll(): Promise<number> {
    let totalPnL = 0

    for (const position of [...this.virtualAccount.positions]) {
      const currentPrice = position.currentPrice
      const pnl = (currentPrice - position.entryPrice) * position.quantity
      totalPnL += pnl

      // Remove position
      this.virtualAccount.positions = this.virtualAccount.positions.filter((p) => p !== position)

      // Add proceeds to balance
      const proceeds = currentPrice * position.quantity - position.quantity * currentPrice * this.virtualAccount.commissionRate
      this.virtualAccount.freeBalance += proceeds
      this.virtualAccount.walletBalance += pnl
    }

    this.updateAccountTotals()
    return totalPnL
  }

  /**
   * Reset the virtual account
   */
  resetAccount(initialBalance: number): void {
    this.virtualAccount = {
      walletBalance: initialBalance,
      totalBalance: initialBalance,
      freeBalance: initialBalance,
      positions: [],
      orders: [],
      commissionRate: 0.001,
      totalPnL: 0,
      totalPnLPercent: 0,
    }
  }

  /**
   * Export account history for analysis
   */
  exportHistory(): {
    account: BinancePaperAccount
    positions: BinancePaperPosition[]
    orders: BinancePaperOrder[]
    timestamp: Date
  } {
    return {
      account: this.virtualAccount,
      positions: this.virtualAccount.positions,
      orders: this.virtualAccount.orders,
      timestamp: new Date(),
    }
  }
}

// Default instance
let binancePaperTradingInstance: BinancePaperTradingService | null = null

export function initializeBinancePaperTrading(
  apiKey: string,
  apiSecret: string,
  initialBalance: number = 10000
): BinancePaperTradingService {
  if (binancePaperTradingInstance) {
    binancePaperTradingInstance.stopPriceUpdates()
  }

  binancePaperTradingInstance = new BinancePaperTradingService(apiKey, apiSecret, initialBalance)
  return binancePaperTradingInstance
}

export function getBinancePaperTrading(): BinancePaperTradingService {
  if (!binancePaperTradingInstance) {
    binancePaperTradingInstance = new BinancePaperTradingService('', '', 10000)
  }
  return binancePaperTradingInstance
}

export default {
  initialize: initializeBinancePaperTrading,
  getInstance: getBinancePaperTrading,
}
