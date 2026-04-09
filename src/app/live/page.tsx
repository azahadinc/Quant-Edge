
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, Pause, Activity, Zap, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react"

const activeTrades = [
  { id: 1, pair: 'BTC/USDT', strategy: 'Golden Cross', side: 'LONG', pnl: '+12.4%', amount: '0.45 BTC', status: 'RUNNING' },
  { id: 2, pair: 'ETH/USDT', strategy: 'Mean Reversion', side: 'SHORT', pnl: '-2.1%', amount: '12.2 ETH', status: 'RUNNING' },
]

export default function LiveTradingPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Trading</h1>
          <p className="text-muted-foreground">Monitor and control your active algorithmic sessions in real-time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" className="gap-2">
            <Pause className="w-4 h-4" /> Panic Sell All
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4" /> Deploy Strategy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Active Executions
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8">
              <RefreshCw className="w-3 h-3 mr-2" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${trade.side === 'LONG' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {trade.side === 'LONG' ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <div className="font-bold">{trade.pair}</div>
                      <div className="text-xs text-muted-foreground">{trade.strategy} • {trade.amount}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${trade.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl}
                    </div>
                    <Badge variant="outline" className="text-[10px] animate-pulse">LIVE</Badge>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">Modify</Button>
                    <Button variant="secondary" size="sm">Close</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Risk Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Loss Limit</span>
                <span className="font-mono">$2,000 / $5,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-mono">4.2% / 10%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" /> Execution Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground mt-1">Average Latency: 4ms</p>
              <p className="text-xs text-muted-foreground">Server Location: AWS-Tokyo</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
