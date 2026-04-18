'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, Legend
} from 'recharts'
import {
  Zap, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle,
  Loader2, Server, Gauge, DollarSign, Percent, Clock, Target, Shield,
  Wifi, Radio, Zap as ZapIcon, Cpu, Database
} from "lucide-react"

interface BotData {
  botId: string
  strategy: string
  exchange: 'alpaca' | 'binance'
  mode: 'paper' | 'live'
  entryTime: Date
  
  // Portfolio Data
  equity: number
  buyingPower: number
  leverage: number
  dayPnL: number
  dayPnLPercent: number
  
  // Market Brain
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS'
  confidence: number
  status: 'STABLE' | 'VOLATILE' | 'RANGING'
  targetAllocation: number
  currentAllocation: number
  rebalanceNeeded: boolean
  
  // Active Positions
  positions: Array<{
    time: Date
    ticker: string
    side: 'BUY' | 'SELL'
    entryPrice: number
    quantity: number
    unrealizedPnL: number
    unrealizedPnLPercent: number
    stopLoss: number
    currentPrice: number
  }>
  
  // Recent Signals
  signals: Array<{
    time: Date
    ticker: string
    action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT'
    signal: string
    reason: string
  }>
  
  // Risk Metrics
  maxDrawdown: number
  maxDailyLoss: number
  correlation: number
  circuitBreakerActive: boolean
  lockFile: string | null
  exposureStatus: 'WITHIN' | 'WARNING' | 'EXCEEDED'
  
  // System Health
  dataFeedOK: boolean
  apiLatency: number
  apiBroker: 'ALPACA' | 'BINANCE'
  logsStreaming: boolean
  uptime: number // seconds
  engineStatus: 'SYNCED' | 'SYNCING' | 'ERROR'
  
  // Equity Curve
  equityCurve: Array<{ time: string; value: number }>
}

export function LiveBotDashboard({ botData }: { botData: BotData }) {
  const [runtime, setRuntime] = useState('00:00:00')
  const [dataLatency, setDataLatency] = useState(150)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(botData.entryTime).getTime()) / 1000)
      const h = Math.floor(diff / 3600).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setRuntime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [botData.entryTime])

  const regimeColor = {
    'BULL': 'text-green-600 bg-green-50',
    'BEAR': 'text-red-600 bg-red-50',
    'SIDEWAYS': 'text-yellow-600 bg-yellow-50'
  }

  const statusColor = {
    'STABLE': 'text-blue-600',
    'VOLATILE': 'text-orange-600',
    'RANGING': 'text-purple-600'
  }

  const totalPnL = useMemo(() => {
    return botData.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
  }, [botData.positions])

  const totalPnLPercent = useMemo(() => {
    const invested = botData.positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.quantity), 0)
    return invested > 0 ? (totalPnL / invested) * 100 : 0
  }, [botData.positions])

  return (
    <div className="w-full space-y-6 p-4">
      {/* Header with Bot Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{botData.strategy}</h1>
            <Badge variant={botData.mode === 'live' ? 'default' : 'secondary'}>
              {botData.mode === 'live' ? '🔴 LIVE' : '📄 PAPER TRADING'}
            </Badge>
            <Badge variant="outline">{botData.exchange.toUpperCase()}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Uptime: {runtime} • Started: {new Date(botData.entryTime).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">${botData.equity.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          <p className="text-sm text-muted-foreground">Account Equity</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="health">System</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Block */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Portfolio Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">EQUITY</p>
                  <p className="text-2xl font-bold">${botData.equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-green-600">Total Account Value</p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">DAY P&L</p>
                  <p className={`text-2xl font-bold ${botData.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {botData.dayPnL >= 0 ? '+' : ''}{botData.dayPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs ${botData.dayPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {botData.dayPnLPercent >= 0 ? '+' : ''}{botData.dayPnLPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">BUYING POWER</p>
                  <p className="text-2xl font-bold">${botData.buyingPower.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-muted-foreground">Available for Trades</p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">LEVERAGE</p>
                  <p className="text-2xl font-bold">{botData.leverage.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground">Current Position</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Regime & Brain */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Market Regime & Strategy Brain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={`border rounded-lg p-4 space-y-2 ${regimeColor[botData.marketRegime]}`}>
                  <p className="text-xs font-medium">DETECTED</p>
                  <p className="text-2xl font-bold">{botData.marketRegime}</p>
                  <p className="text-xs opacity-70">Market Condition</p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">CONFIDENCE</p>
                  <p className="text-2xl font-bold">{botData.confidence}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${botData.confidence}%` }}
                    />
                  </div>
                </div>
                <div className={`border rounded-lg p-4 space-y-2 ${statusColor[botData.status]}`}>
                  <p className="text-xs font-medium">STATUS</p>
                  <p className="text-2xl font-bold">{botData.status}</p>
                  <p className="text-xs opacity-70">Strategy Status</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">TARGET ALLOCATION</p>
                  <p className="text-xl font-bold">{botData.targetAllocation}%</p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">CURRENT ALLOCATION</p>
                  <p className="text-xl font-bold">{botData.currentAllocation}%</p>
                </div>
              </div>

              {botData.rebalanceNeeded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Rebalancing Required</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equity Curve */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={botData.equityCurve}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : value}`} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSITIONS TAB */}
        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Active Positions ({botData.positions.length})
                </span>
                <span className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({totalPnLPercent.toFixed(2)}%)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-xs font-semibold text-muted-foreground">
                      <th className="p-2">TIME</th>
                      <th className="p-2">TICKER</th>
                      <th className="p-2">SIDE</th>
                      <th className="p-2 text-right">ENTRY PRICE</th>
                      <th className="p-2 text-right">CURRENT PRICE</th>
                      <th className="p-2 text-right">QTY</th>
                      <th className="p-2 text-right">UNREALIZED P&L</th>
                      <th className="p-2 text-right">STOP LOSS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {botData.positions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">No active positions</td>
                      </tr>
                    ) : (
                      botData.positions.map((pos, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2 text-xs">{pos.time.toLocaleTimeString()}</td>
                          <td className="p-2 font-semibold">{pos.ticker}</td>
                          <td className="p-2">
                            <Badge variant={pos.side === 'BUY' ? 'default' : 'destructive'}>
                              {pos.side}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">${pos.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-semibold">${pos.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right">{pos.quantity}</td>
                          <td className={`p-2 text-right font-semibold ${pos.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({pos.unrealizedPnLPercent.toFixed(2)}%)
                          </td>
                          <td className="p-2 text-right text-xs">${pos.stopLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SIGNALS TAB */}
        <TabsContent value="signals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Recent Signals (Last 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {botData.signals.length === 0 ? (
                  <p className="text-muted-foreground">No signals yet</p>
                ) : (
                  botData.signals.slice(0, 10).map((sig, idx) => (
                    <div key={idx} className="border rounded-lg p-3 hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{sig.time.toLocaleTimeString()}</span>
                            <span className="font-semibold">{sig.ticker}</span>
                            <Badge variant={
                              sig.action === 'BUY' ? 'default' :
                              sig.action === 'SELL' ? 'destructive' :
                              sig.action === 'EXIT' ? 'secondary' : 'outline'
                            }>
                              {sig.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{sig.signal}</p>
                          <p className="text-xs text-muted-foreground">Reason: {sig.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RISK TAB */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk & Safety Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">MAX DRAWDOWN</p>
                  <p className="text-2xl font-bold text-orange-600">{botData.maxDrawdown.toFixed(2)}%</p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">MAX DAILY LOSS</p>
                  <p className="text-2xl font-bold text-red-600">{botData.maxDailyLoss.toFixed(2)}%</p>
                </div>
                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">CORRELATION</p>
                  <p className="text-2xl font-bold">{botData.correlation.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-lg p-4 space-y-1 ${botData.circuitBreakerActive ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium">CIRCUIT BREAKER</p>
                  <div className="flex items-center gap-2">
                    {botData.circuitBreakerActive ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-600">ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-600">INACTIVE</span>
                      </>
                    )}
                  </div>
                </div>

                <div className={`border rounded-lg p-4 space-y-1 ${botData.exposureStatus === 'WITHIN' ? 'bg-green-50' : botData.exposureStatus === 'WARNING' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium">EXPOSURE STATUS</p>
                  <p className={`font-semibold ${
                    botData.exposureStatus === 'WITHIN' ? 'text-green-600' :
                    botData.exposureStatus === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {botData.exposureStatus === 'WITHIN' ? 'WITHIN LIMITS' : 
                     botData.exposureStatus === 'WARNING' ? 'WARNING' : 'EXCEEDED'}
                  </p>
                </div>
              </div>

              {botData.lockFile && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Lock File Active</p>
                    <p className="text-xs text-red-700">{botData.lockFile}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM HEALTH TAB */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className={`border rounded-lg p-4 space-y-1 ${botData.dataFeedOK ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    DATA FEED
                  </p>
                  <p className={`font-semibold ${botData.dataFeedOK ? 'text-green-600' : 'text-red-600'}`}>
                    {botData.dataFeedOK ? '✅ OK' : '❌ ERROR'}
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    API LATENCY
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{botData.apiLatency}ms</p>
                  <p className="text-xs text-muted-foreground">{botData.apiBroker}</p>
                </div>

                <div className={`border rounded-lg p-4 space-y-1 ${botData.engineStatus === 'SYNCED' ? 'bg-green-50' : botData.engineStatus === 'SYNCING' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium">ENGINE STATUS</p>
                  <p className={`font-semibold ${
                    botData.engineStatus === 'SYNCED' ? 'text-green-600' :
                    botData.engineStatus === 'SYNCING' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {botData.engineStatus}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                <div className={`border rounded-lg p-4 space-y-1 ${botData.logsStreaming ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium">LOGS</p>
                  <p className={`font-semibold ${botData.logsStreaming ? 'text-green-600' : 'text-red-600'}`}>
                    {botData.logsStreaming ? '📡 STREAMING' : '❌ STOPPED'}
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-1">
                  <p className="text-xs font-medium">UPTIME</p>
                  <p className="text-2xl font-bold">{runtime}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">Last Health Check</p>
                <p className="text-xs text-blue-800">{new Date().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
