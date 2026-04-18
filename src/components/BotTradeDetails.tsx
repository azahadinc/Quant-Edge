"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid,
  LineChart, Line
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

interface Position {
  symbol: string
  qty: number
  entryPrice: number
  currentPrice: number
  side: 'BUY' | 'SELL'
  unrealizedPnL: number
  unrealizedPnLPercent: number
  entryTime: Date
}

interface EquityCurvePoint {
  timestamp: number
  equity: number
  dayPL: number
}

interface BotTradeDetailsProps {
  botId: string
  strategy: string
  exchange: 'alpaca' | 'binance'
  mode: 'PAPER' | 'LIVE'
  status: 'RUNNING' | 'PAUSED' | 'STOPPED'
  equity: number
  dayPL: number
  dayPLPercent: number
  buyingPower: number
  leverage: number
  positions: Position[]
  equityCurve: EquityCurvePoint[]
  marketRegime?: {
    detected: string
    confidence: number
    status: string
    targetAlloc: number
    currentAlloc: number
    rebalance: string
  }
  healthCheck?: {
    dataFeed: 'OK' | 'ERROR'
    apiLatency: number
    lastUpdate: number
    uptime: string
  }
}

export function BotTradeDetails({
  botId,
  strategy,
  exchange,
  mode,
  status,
  equity,
  dayPL,
  dayPLPercent,
  buyingPower,
  leverage,
  positions,
  equityCurve,
  marketRegime,
  healthCheck
}: BotTradeDetailsProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  return (
    <div className="space-y-4">
      {/* Bot Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold">{botId}</h2>
          <p className="text-sm text-muted-foreground">{strategy} • {exchange.toUpperCase()} {mode}</p>
        </div>
        <div className="flex gap-2">
          <Badge 
            className={`${
              status === 'RUNNING' 
                ? 'bg-green-500/20 text-green-100' 
                : status === 'PAUSED'
                ? 'bg-yellow-500/20 text-yellow-100'
                : 'bg-red-500/20 text-red-100'
            }`}
          >
            {status}
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-100">{mode}</Badge>
        </div>
      </div>

      {/* Portfolio Block */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Equity</p>
              <p className="text-lg lg:text-xl font-bold">${equity.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Day P&L</p>
              <div className={`text-lg lg:text-xl font-bold ${dayPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {dayPL >= 0 ? '+' : ''}{dayPL.toFixed(2)} ({dayPLPercent.toFixed(2)}%)
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Buying Power</p>
              <p className="text-lg lg:text-xl font-bold">${buyingPower.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Leverage</p>
              <p className="text-lg lg:text-xl font-bold">{leverage.toFixed(2)}x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity Curve Chart */}
      {equityCurve && equityCurve.length > 0 && (
        <Card className="border-border/50 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="rgba(255,255,255,0.3)"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(val) => `$${val.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,30,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#3b82f6" 
                  fill="url(#equityGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Market Regime */}
      {marketRegime && (
        <Card className="border-border/50 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Market Regime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Detected</p>
                <Badge className="bg-primary/20 text-primary">{marketRegime.detected}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Confidence</p>
                <p className="font-semibold">{marketRegime.confidence}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                <Badge className="bg-green-500/20 text-green-100">{marketRegime.status}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Target Alloc</p>
                <p className="font-semibold">{marketRegime.targetAlloc}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Current Alloc</p>
                <p className="font-semibold">{marketRegime.currentAlloc}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Rebalance</p>
                <Badge variant="outline">{marketRegime.rebalance}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Positions */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">Active Positions ({positions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No open positions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-left py-2 px-2">Time</th>
                    <th className="text-left py-2 px-2">Ticker</th>
                    <th className="text-left py-2 px-2">Side</th>
                    <th className="text-right py-2 px-2">Entry Price</th>
                    <th className="text-right py-2 px-2">Current</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, idx) => (
                    <tr 
                      key={idx} 
                      className="border-b border-border/30 hover:bg-background/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedPosition(selectedPosition?.symbol === pos.symbol ? null : pos)}
                    >
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {pos.entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2 font-semibold">{pos.symbol}</td>
                      <td className="py-3 px-2">
                        <Badge variant={pos.side === 'BUY' ? 'default' : 'secondary'}>
                          {pos.side}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">${pos.entryPrice.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">{pos.qty}</td>
                      <td className={`py-3 px-2 text-right font-semibold ${
                        pos.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} ({pos.unrealizedPnLPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      {healthCheck && (
        <Card className="border-border/50 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                  {healthCheck.dataFeed === 'OK' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                  Data Feed
                </p>
                <p className="font-semibold text-sm">{healthCheck.dataFeed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">API Latency</p>
                <p className="font-semibold text-sm">{healthCheck.apiLatency}ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Mode</p>
                <p className="font-semibold text-sm">{mode} Trading</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Uptime</p>
                <p className="font-semibold text-sm">{healthCheck.uptime}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Last Update</p>
                <p className="font-semibold text-sm">{new Date(healthCheck.lastUpdate).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BotTradeDetails
