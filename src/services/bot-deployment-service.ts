import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'
import { getAuth } from 'firebase/auth'

const { firestore: db } = initializeFirebase()

export interface BacktestResult {
  startDate: string
  endDate: string
  initialCapital: number
  finalCapital: number
  totalReturn: number
  winRate: number
  profitFactor: number
  maxDrawdown: number
  sharpeRatio: number
  trades: number
  winners: number
  losers: number
  avgWinSize: number
  avgLossSize: number
  riskRewardRatio: number
}

export interface BotConfig {
  botId: string
  userId: string
  strategyId: string
  strategyName: string
  exchange: 'alpaca' | 'binance'
  mode: 'paper' | 'live'
  
  // From backtest
  backtestResult: BacktestResult
  backtestDate: Date
  
  // Bot settings
  initialCapital: number
  leverage: number
  maxDrawdownPercent: number
  maxDailyLossPercent: number
  positionSizePercent: number
  correlationThreshold: number
  circuitBreakerEnabled: boolean
  
  // Status
  status: 'CREATED' | 'DEPLOYED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR'
  deployedAt?: Date
  startedAt?: Date
  stoppedAt?: Date
  
  // Risk params
  stopLossPercent: number
  takeProfitPercent: number
  
  // Execution
  apiKey?: string
  apiSecret?: string
  paperTrading: boolean
  
  // Equity curve tracking
  startingEquity: number
  currentEquity: number
  equityCurve: Array<{ timestamp: Date; equity: number }>
}

export interface LivePosition {
  positionId: string
  botId: string
  ticker: string
  side: 'BUY' | 'SELL'
  entryPrice: number
  quantity: number
  entryTime: Date
  currentPrice?: number
  unrealizedPnL?: number
  stopLoss: number
  takeProfit: number
  status: 'OPEN' | 'CLOSED' | 'PENDING'
}

export interface BotSignal {
  signalId: string
  botId: string
  timestamp: Date
  ticker: string
  action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT'
  signal: string
  reason: string
  confidence: number
  executed: boolean
  executedAt?: Date
}

export class BotDeploymentService {
  private static instance: BotDeploymentService
  private userId: string | null = null

  private constructor() {
    const auth = getAuth()
    this.userId = auth.currentUser?.uid || null
  }

  static getInstance(): BotDeploymentService {
    if (!BotDeploymentService.instance) {
      BotDeploymentService.instance = new BotDeploymentService()
    }
    return BotDeploymentService.instance
  }

  private getPath(path: string): string {
    if (!this.userId) throw new Error('User not authenticated')
    return path.replace('{uid}', this.userId)
  }

  /**
   * Deploy a backtest result as a live trading bot
   */
  async deployBot(
    strategyId: string,
    strategyName: string,
    backtestResult: BacktestResult,
    config: Partial<BotConfig>
  ): Promise<BotConfig> {
    if (!this.userId) throw new Error('User not authenticated')

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const botConfig: BotConfig = {
      botId,
      userId: this.userId,
      strategyId,
      strategyName,
      exchange: config.exchange || 'alpaca',
      mode: config.mode || 'paper',
      
      backtestResult,
      backtestDate: now,
      
      initialCapital: config.initialCapital || 10000,
      leverage: config.leverage || 1,
      maxDrawdownPercent: config.maxDrawdownPercent || 20,
      maxDailyLossPercent: config.maxDailyLossPercent || 10,
      positionSizePercent: config.positionSizePercent || 5,
      correlationThreshold: config.correlationThreshold || 0.7,
      circuitBreakerEnabled: config.circuitBreakerEnabled !== false,
      
      status: 'CREATED',
      
      stopLossPercent: config.stopLossPercent || 5,
      takeProfitPercent: config.takeProfitPercent || 10,
      
      paperTrading: config.mode === 'paper' || config.paperTrading !== false,
      
      startingEquity: config.initialCapital || 10000,
      currentEquity: config.initialCapital || 10000,
      equityCurve: [{ timestamp: now, equity: config.initialCapital || 10000 }],
    }

    // Save to Firestore
    const botDocRef = doc(db, `users/${this.userId}/bots`, botId)
    await setDoc(botDocRef, {
      ...botConfig,
      backtestDate: botConfig.backtestDate,
      createdAt: now,
      updatedAt: now,
    })

    return botConfig
  }

  /**
   * Start a deployed bot
   */
  async startBot(botId: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    const now = new Date()

    // Update bot status
    await updateDoc(botRef, {
      status: 'RUNNING',
      startedAt: now,
      deployedAt: now,
      updatedAt: now,
    })

    // Initialize equity curve
    const botDoc = await getDoc(botRef)
    const botData = botDoc.data() as BotConfig
    
    await updateDoc(botRef, {
      startingEquity: botData.currentEquity,
      equityCurve: [{ timestamp: now, equity: botData.currentEquity }],
    })
  }

  /**
   * Pause a running bot
   */
  async pauseBot(botId: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    await updateDoc(botRef, {
      status: 'PAUSED',
      updatedAt: new Date(),
    })
  }

  /**
   * Resume a paused bot
   */
  async resumeBot(botId: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    await updateDoc(botRef, {
      status: 'RUNNING',
      updatedAt: new Date(),
    })
  }

  /**
   * Stop and liquidate a bot
   */
  async stopBot(botId: string, liquidatePositions: boolean = true): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)

    if (liquidatePositions) {
      // Close all open positions
      const positionsRef = collection(db, `users/${this.userId}/bots/${botId}/positions`)
      const openPositions = await getDocs(query(positionsRef, where('status', '==', 'OPEN')))

      const batch = writeBatch(db)
      openPositions.forEach((doc) => {
        batch.update(doc.ref, { status: 'CLOSED' })
      })
      await batch.commit()
    }

    // Update bot status
    await updateDoc(botRef, {
      status: 'STOPPED',
      stoppedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Delete a bot and all its data
   */
  async deleteBot(botId: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const batch = writeBatch(db)

    // Delete all positions
    const positionsRef = collection(db, `users/${this.userId}/bots/${botId}/positions`)
    const positions = await getDocs(positionsRef)
    positions.forEach((doc) => batch.delete(doc.ref))

    // Delete all signals
    const signalsRef = collection(db, `users/${this.userId}/bots/${botId}/signals`)
    const signals = await getDocs(signalsRef)
    signals.forEach((doc) => batch.delete(doc.ref))

    // Delete bot document
    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    batch.delete(botRef)

    await batch.commit()
  }

  /**
   * Get bot configuration
   */
  async getBot(botId: string): Promise<BotConfig | null> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    const botDoc = await getDoc(botRef)

    if (!botDoc.exists()) return null
    return botDoc.data() as BotConfig
  }

  /**
   * Get all bots for the user
   */
  async getBots(
    filter?: { status?: BotConfig['status']; exchange?: 'alpaca' | 'binance' }
  ): Promise<BotConfig[]> {
    if (!this.userId) throw new Error('User not authenticated')

    let q = query(collection(db, `users/${this.userId}/bots`))

    // Build query with filters
    const conditions = []
    if (filter?.status) {
      conditions.push(where('status', '==', filter.status))
    }
    if (filter?.exchange) {
      conditions.push(where('exchange', '==', filter.exchange))
    }

    if (conditions.length > 0) {
      q = query(collection(db, `users/${this.userId}/bots`), ...conditions)
    }

    const botsSnapshot = await getDocs(q)
    return botsSnapshot.docs.map((doc) => doc.data() as BotConfig)
  }

  /**
   * Update bot equity curve with new equity value
   */
  async updateBotEquity(botId: string, equity: number): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const botRef = doc(db, `users/${this.userId}/bots`, botId)
    const botDoc = await getDoc(botRef)
    const bot = botDoc.data() as BotConfig

    const newEquityCurve = [
      ...(bot.equityCurve || []),
      { timestamp: new Date(), equity },
    ]

    await updateDoc(botRef, {
      currentEquity: equity,
      equityCurve: newEquityCurve.slice(-1000), // Keep last 1000 points
      updatedAt: new Date(),
    })
  }

  /**
   * Open a position for the bot
   */
  async openPosition(botId: string, position: Omit<LivePosition, 'positionId'>): Promise<LivePosition> {
    if (!this.userId) throw new Error('User not authenticated')

    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const positionData: LivePosition = {
      ...position,
      positionId,
      status: 'OPEN',
    }

    const posRef = doc(db, `users/${this.userId}/bots/${botId}/positions`, positionId)
    await setDoc(posRef, positionData)

    return positionData
  }

  /**
   * Close a position
   */
  async closePosition(botId: string, positionId: string, closePrice: number): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const posRef = doc(db, `users/${this.userId}/bots/${botId}/positions`, positionId)
    const posDoc = await getDoc(posRef)
    const position = posDoc.data() as LivePosition

    const pnl =
      position.side === 'BUY'
        ? (closePrice - position.entryPrice) * position.quantity
        : (position.entryPrice - closePrice) * position.quantity

    await updateDoc(posRef, {
      status: 'CLOSED',
      currentPrice: closePrice,
      unrealizedPnL: pnl,
    })
  }

  /**
   * Get all open positions for a bot
   */
  async getPositions(botId: string, status?: 'OPEN' | 'CLOSED'): Promise<LivePosition[]> {
    if (!this.userId) throw new Error('User not authenticated')

    let q = query(collection(db, `users/${this.userId}/bots/${botId}/positions`))

    if (status) {
      q = query(
        collection(db, `users/${this.userId}/bots/${botId}/positions`),
        where('status', '==', status)
      )
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data() as LivePosition)
  }

  /**
   * Record a trading signal
   */
  async recordSignal(botId: string, signal: Omit<BotSignal, 'signalId'>): Promise<BotSignal> {
    if (!this.userId) throw new Error('User not authenticated')

    const signalId = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const signalData: BotSignal = {
      ...signal,
      signalId,
    }

    const sigRef = doc(db, `users/${this.userId}/bots/${botId}/signals`, signalId)
    await setDoc(sigRef, signalData)

    return signalData
  }

  /**
   * Get recent signals for a bot
   */
  async getSignals(botId: string, limit: number = 20): Promise<BotSignal[]> {
    if (!this.userId) throw new Error('User not authenticated')

    const q = query(collection(db, `users/${this.userId}/bots/${botId}/signals`))
    const snapshot = await getDocs(q)

    return snapshot.docs
      .map((doc) => doc.data() as BotSignal)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Mark a signal as executed
   */
  async executeSignal(botId: string, signalId: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const sigRef = doc(db, `users/${this.userId}/bots/${botId}/signals`, signalId)
    await updateDoc(sigRef, {
      executed: true,
      executedAt: new Date(),
    })
  }

  /**
   * Get bot statistics and performance metrics
   */
  async getBotStats(botId: string): Promise<{
    totalPnL: number
    totalPnLPercent: number
    winRate: number
    trades: number
    winningTrades: number
    losingTrades: number
    maxDrawdown: number
    averageWinSize: number
    averageLossSize: number
    profitFactor: number
  }> {
    if (!this.userId) throw new Error('User not authenticated')

    const positions = await this.getPositions(botId)
    const closedPositions = positions.filter((p) => p.status === 'CLOSED')

    const winningTrades = closedPositions.filter((p) => (p.unrealizedPnL || 0) > 0)
    const losingTrades = closedPositions.filter((p) => (p.unrealizedPnL || 0) < 0)

    const totalPnL = closedPositions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0)
    const avgWinSize = winningTrades.length > 0 ? winningTrades.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0) / winningTrades.length : 0
    const avgLossSize = losingTrades.length > 0 ? losingTrades.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0) / losingTrades.length : 0

    const bot = await this.getBot(botId)
    const totalPnLPercent = bot ? (totalPnL / bot.startingEquity) * 100 : 0

    // Calculate equity curve drawdown
    const equityCurve = bot?.equityCurve || []
    let maxDrawdown = 0
    let peak = equityCurve[0]?.equity || 0

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity
      }
      const drawdown = ((peak - point.equity) / peak) * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    return {
      totalPnL,
      totalPnLPercent,
      winRate: closedPositions.length > 0 ? (winningTrades.length / closedPositions.length) * 100 : 0,
      trades: closedPositions.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      maxDrawdown,
      averageWinSize: avgWinSize,
      averageLossSize: Math.abs(avgLossSize),
      profitFactor: Math.abs(avgLossSize) > 0 ? Math.abs(avgWinSize) / Math.abs(avgLossSize) : 0,
    }
  }
}

export default BotDeploymentService.getInstance()
