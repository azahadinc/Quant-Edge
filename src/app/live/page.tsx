
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, Pause, Activity, Zap, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Terminal, StopCircle, Settings2, AlertTriangle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LiveTrade {
  id: string;
  pair: string;
  strategy: string;
  side: 'LONG' | 'SHORT';
  pnl: number;
  amount: string;
  entryPrice: string;
  currentPrice: string;
  status: 'OPEN' | 'CLOSED';
  timestamp: string;
}

export default function LiveTradingPage() {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [activeTrades, setActiveTrades] = useState<LiveTrade[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [equity, setEquity] = useState(47502.12)
  const logEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Simulation loop for live price and PnL updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setActiveTrades(current => current.map(trade => {
        if (trade.status === 'CLOSED') return trade;
        
        // Random price fluctuation
        const change = (Math.random() - 0.5) * 10;
        const newPrice = parseFloat(trade.currentPrice.replace(/[^0-9.]/g, '')) + change;
        const pnlChange = (Math.random() - 0.45) * 0.1; // Slight upward bias
        
        return {
          ...trade,
          currentPrice: `$${newPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          pnl: trade.pnl + pnlChange
        };
      }));

      // Update total equity based on PnL
      setEquity(prev => prev + (Math.random() - 0.48) * 5);

      // Occasional log messages
      if (Math.random() > 0.85) {
        const msgs = [
          "[STRATEGY] Indicators updated. EMA cross remains bullish.",
          "[EXCHANGE] WebSocket heartbeat received.",
          "[RISK] Margin level check: 450% (Healthy)",
          "[ORDER] Updating trailing stop-loss for BTC/USDT..."
        ];
        setLogs(prev => [...prev.slice(-49), msgs[Math.floor(Math.random() * msgs.length)]]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const deployBot = () => {
    setIsDeploying(true)
    setLogs(["[SYSTEM] Initializing secure connection to Binance API...", "[SYSTEM] Validating strategy: Golden Cross V2..."])
    
    setTimeout(() => {
      setIsLive(true)
      setIsDeploying(false)
      setActiveTrades([
        { 
          id: '1', 
          pair: 'BTC/USDT', 
          strategy: 'Golden Cross', 
          side: 'LONG', 
          pnl: 0.15, 
          amount: '0.45 BTC', 
          entryPrice: '64,120.50',
          currentPrice: '64,231.50',
          status: 'OPEN',
          timestamp: new Date().toLocaleTimeString()
        },
        { 
          id: '2', 
          pair: 'ETH/USDT', 
          strategy: 'Mean Reversion', 
          side: 'SHORT', 
          pnl: -0.05, 
          amount: '12.2 ETH', 
          entryPrice: '3,425.00',
          currentPrice: '3,421.20',
          status: 'OPEN',
          timestamp: new Date().toLocaleTimeString()
        }
      ])
      setLogs(prev => [...prev, "[SUCCESS] Bot successfully deployed to production.", "[LIVE] Monitoring signals..."])
      toast({
        title: "Bot Deployed",
        description: "Your algorithmic session is now live on the exchange."
      })
    }, 2500)
  }

  const stopBot = () => {
    setIsLive(false)
    setActiveTrades([])
    setLogs(prev => [...prev, "[SYSTEM] Shutdown signal received.", "[SYSTEM] Closing all active orders...", "[SYSTEM] Bot stopped."])
    toast({
      variant: "destructive",
      title: "Bot Stopped",
      description: "Live trading session has been terminated."
    })
  }

  const handlePanicSell = () => {
    setLogs(prev => [...prev, "[CRITICAL] PANIC SELL TRIGGERED. Closing all positions at MARKET price."])
    setActiveTrades(current => current.map(t => ({ ...t, status: 'CLOSED', pnl: t.pnl - 0.2 })))
    setTimeout(stopBot, 1500)
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Trading</h1>
          <p className="text-muted-foreground">Monitor and control your active algorithmic sessions in real-time.</p>
        </div>
        <div className="flex gap-2">
          {isLive && (
            <Button variant="destructive" className="gap-2" onClick={handlePanicSell}>
              <AlertTriangle className="w-4 h-4" /> Panic Sell All
            </Button>
          )}
          {!isLive ? (
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700" 
              onClick={deployBot}
              disabled={isDeploying}
            >
              {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isDeploying ? "Deploying..." : "Deploy Strategy"}
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" onClick={stopBot}>
              <StopCircle className="w-4 h-4 text-red-500" /> Stop Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Executions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Active Executions
              </CardTitle>
              {isLive && <Badge className="bg-green-500 animate-pulse">LIVE CONNECTED</Badge>}
            </CardHeader>
            <CardContent>
              {!isLive && !isDeploying ? (
                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg opacity-40">
                  <Zap className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">No bots currently active</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${trade.side === 'LONG' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {trade.side === 'LONG' ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            {trade.pair} 
                            <Badge variant="outline" className="text-[10px] font-normal uppercase">{trade.side}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{trade.strategy} • {trade.amount}</div>
                          <div className="text-[10px] font-mono text-muted-foreground/60 mt-1">Entry: {trade.entryPrice} | Cur: {trade.currentPrice}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className={`text-xl font-mono font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}%
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Settings2 className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-7 text-[10px]">CLOSE</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Output Console */}
          <Card className="bg-black/90 border-primary/20">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="text-xs font-mono text-primary flex items-center gap-2">
                <Terminal className="w-3 h-3" /> LIVE_EXECUTION_LOG
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-1">
              {logs.length === 0 && <div className="text-muted-foreground/50">Waiting for bot deployment...</div>}
              {logs.map((log, i) => (
                <div key={i} className={log.includes('[CRITICAL]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-blue-300'}>
                  <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Real-time Performance */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Session Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="flex items-center gap-2 mt-2 text-green-500 text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" /> 2.4% (Today)
              </div>
            </CardContent>
          </Card>

          {/* Risk Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Risk Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Daily Loss Limit</span>
                  <span className="font-mono text-primary">$450 / $5,000</span>
                </div>
                <Progress value={9} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Exposure Ratio</span>
                  <span className="font-mono text-primary">12.5% / 25%</span>
                </div>
                <Progress value={50} className="h-1.5" />
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
                  <span>Server Status</span>
                  <span className="flex items-center gap-1 text-green-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> AWS-TYO-LIVE
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-primary ${isLive ? 'animate-spin' : ''}`} /> Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">4.2ms</div>
              <p className="text-xs text-muted-foreground mt-1">Binance Direct-API connected</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
