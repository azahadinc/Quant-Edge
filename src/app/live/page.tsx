
"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, Activity, Zap, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Terminal, StopCircle, AlertTriangle,
  Loader2, Trophy, ShieldAlert,
  Lock, Calculator, Info, Sparkles, ArrowRight, TrendingUp
} from "lucide-react"
import { 
  AreaChart, Area, ResponsiveContainer, YAxis, XAxis
} from 'recharts'
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore'
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { INITIAL_MARKET_DATA } from '../screener/page'
import Link from 'next/link'

interface LiveTrade {
  id: string;
  instrumentId: string;
  strategyId: string;
  strategyName: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  status: 'OPEN' | 'CLOSED';
  entryTime: any;
  userId: string;
  // UI helpers
  chartData?: any[];
}

export default function LiveTradingPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [isDeploying, setIsDeploying] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [equity, setEquity] = useState(50000.00)
  const [hwm, setHwm] = useState(50000.00) 
  const [dailyStartingEquity] = useState(50000.00)
  const [isAccountSuspended, setIsAccountSuspended] = useState(false)
  
  const [calcRiskPct, setCalcRiskPct] = useState("1")
  const [calcStopLoss, setCalcStopLoss] = useState("500")
  const [calcResult, setCalcResult] = useState<{size: string, margin: string} | null>(null)

  const [config, setConfig] = useState({
    strategyId: '',
    broker: 'alpaca_paper',
    symbol: 'BTC/USDT',
    amount: '5000',
  })

  const logEndRef = useRef<HTMLDivElement>(null)

  const DAILY_LOSS_LIMIT = 0.05 
  const MAX_DRAWDOWN_LIMIT = 0.10 
  const PROFIT_TARGET_PHASE1 = 0.10 
  const INITIAL_BALANCE = 50000.00

  // Fetch user strategies
  const strategiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'strategies')
  }, [db, user])
  const { data: savedStrategies, isLoading: isLoadingStrategies } = useCollection<any>(strategiesQuery)

  // Fetch active positions from Firestore for persistence
  const positionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, 'users', user.uid, 'tradingAccounts', 'default', 'positions'),
      where('status', '==', 'open')
    )
  }, [db, user])
  const { data: persistentPositions, isLoading: isLoadingPositions } = useCollection<any>(positionsQuery)

  // Local state for live price simulation data
  const [livePrices, setLivePrices] = useState<Record<string, { price: number, pnl: number, chart: any[] }>>({})

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Simulation Loop: Updates prices and charts for all persistent positions
  useEffect(() => {
    if (!persistentPositions || persistentPositions.length === 0 || isAccountSuspended) return

    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev }
        persistentPositions.forEach(pos => {
          const basePrice = INITIAL_MARKET_DATA.find(i => i.symbol === pos.instrumentId)?.price || 64000
          const currentData = next[pos.id] || { 
            price: pos.entryPrice, 
            pnl: 0, 
            chart: Array.from({length: 10}, (_, i) => ({ val: pos.entryPrice })) 
          }
          
          const change = (Math.random() - 0.5) * (basePrice * 0.001)
          const newPrice = currentData.price + change
          const pnl = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100 * (pos.side === 'LONG' ? 1 : -1)
          
          next[pos.id] = {
            price: newPrice,
            pnl: pnl,
            chart: [...currentData.chart.slice(-19), { val: newPrice }]
          }
        })
        return next
      })

      // Update Equity Curve Simulation
      setEquity(prev => {
        const pnlTick = (Math.random() - 0.48) * 15
        const nextEquity = prev + pnlTick
        if (nextEquity > hwm) setHwm(nextEquity)
        
        const dailyLoss = ((dailyStartingEquity - nextEquity) / dailyStartingEquity)
        if (dailyLoss >= DAILY_LOSS_LIMIT) suspendAccount("DAILY LOSS LIMIT BREACHED")
        
        return nextEquity
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [persistentPositions, isAccountSuspended, hwm, dailyStartingEquity])

  const suspendAccount = (reason: string) => {
    setIsAccountSuspended(true)
    setLogs(prev => [...prev, `[CRITICAL] Compliance Engine: ${reason}`, "[SYSTEM] Account Suspended. All positions liquidated."])
    toast({ variant: "destructive", title: "Hard Stop Triggered", description: reason })
  }

  const deployBot = async () => {
    if (!config.strategyId || !user || !db) return
    setIsConfigOpen(false)
    setIsDeploying(true)
    
    setLogs(prev => [...prev, `[SYSTEM] Booting Compliance Engine...`, `[AUTH] Authenticating with ${config.broker}...`, `[SUCCESS] Connection Established.`])
    
    const strategy = savedStrategies?.find(s => s.id === config.strategyId)
    const startPrice = INITIAL_MARKET_DATA.find(i => i.symbol === config.symbol)?.price || 64000
    
    const positionData = {
      id: doc(collection(db, 'temp')).id,
      instrumentId: config.symbol,
      strategyId: config.strategyId,
      strategyName: strategy?.name || "Bot",
      side: 'LONG',
      entryPrice: startPrice,
      quantity: parseFloat(config.amount) / startPrice,
      status: 'open',
      entryTime: serverTimestamp(),
      userId: user.uid,
      tradingAccountId: 'default'
    }

    try {
      await setDocumentNonBlocking(
        doc(db, 'users', user.uid, 'tradingAccounts', 'default', 'positions', positionData.id),
        positionData,
        { merge: true }
      )
      toast({ title: "Bot Deployed", description: `Logic active for ${config.symbol}` })
    } catch (e) {
      toast({ variant: "destructive", title: "Deployment Failed" })
    } finally {
      setIsDeploying(false)
    }
  }

  const closePosition = async (posId: string) => {
    if (!user || !db) return
    try {
      await deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'tradingAccounts', 'default', 'positions', posId))
      setLogs(prev => [...prev, `[SYSTEM] Position ${posId} closed by user.`])
      toast({ title: "Position Closed", description: "Market order executed successfully." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error closing position" })
    }
  }

  const calculateRisk = () => {
    const riskAmt = INITIAL_BALANCE * (parseFloat(calcRiskPct) / 100)
    const stopLossPips = parseFloat(calcStopLoss)
    const lotSize = riskAmt / stopLossPips
    setCalcResult({ size: lotSize.toFixed(2), margin: (lotSize * 1000).toLocaleString() })
  }

  const progressToTarget = Math.max(0, Math.min(100, ((equity - INITIAL_BALANCE) / (INITIAL_BALANCE * PROFIT_TARGET_PHASE1)) * 100))

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto bg-[#080A0C]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            Execution Console <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">Persistent Sessions</Badge>
          </h1>
          <p className="text-muted-foreground">Real-time persistence and compliance monitoring across browser sessions.</p>
        </div>
        <div className="flex gap-2">
          {isAccountSuspended ? (
             <Badge variant="destructive" className="h-10 px-4 flex gap-2 animate-pulse">
               <Lock className="w-4 h-4" /> TRADING SUSPENDED
             </Badge>
          ) : (
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4" /> Deploy New Strategy
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Deploy Compliant Strategy</DialogTitle>
                  <DialogDescription>Settings will be persisted to your institutional trading profile.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Strategy</Label>
                    <div className="col-span-3">
                      <Select value={config.strategyId} onValueChange={(v) => setConfig({...config, strategyId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Strategy" /></SelectTrigger>
                        <SelectContent>
                          {savedStrategies?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Symbol</Label>
                    <Input value={config.symbol} onChange={(e) => setConfig({...config, symbol: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Investment</Label>
                    <div className="col-span-3 relative">
                       <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">$</span>
                       <Input value={config.amount} onChange={(e) => setConfig({...config, amount: e.target.value})} className="pl-6" type="number" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Broker</Label>
                    <Select value={config.broker} onValueChange={(v) => setConfig({...config, broker: v})} className="col-span-3">
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpaca_paper">Alpaca Paper (Live)</SelectItem>
                          <SelectItem value="binance_test">Binance Testnet</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                   <Button onClick={deployBot} className="w-full bg-primary" disabled={!config.strategyId || isDeploying}>
                     {isDeploying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                     Initialize Execution
                   </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Health Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-primary flex items-center justify-between">
                Account Equity
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold font-mono">${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>Phase 1 Goal: $55,000</span>
                  <span className="text-primary">{progressToTarget.toFixed(1)}%</span>
                </div>
                <Progress value={progressToTarget} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Risk Guardrails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Max Daily Loss (5%)</span>
                    <span className="text-green-500">0.00%</span>
                  </div>
                  <Progress value={0} className="h-1" />
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>Total Drawdown (10%)</span>
                    <span className="text-green-500">0.00%</span>
                  </div>
                  <Progress value={0} className="h-1" />
               </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Risk Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Risk %</Label>
                  <Input value={calcRiskPct} onChange={(e) => setCalcRiskPct(e.target.value)} className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">SL (Pips)</Label>
                  <Input value={calcStopLoss} onChange={(e) => setCalcStopLoss(e.target.value)} className="h-7 text-xs" />
                </div>
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={calculateRisk}>Calculate Size</Button>
              {calcResult && (
                <div className="p-2 rounded bg-primary/5 border border-primary/20 text-center">
                  <div className="text-[10px] text-muted-foreground">Lot Size</div>
                  <div className="text-lg font-bold text-primary">{calcResult.size}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Persistent Trades & Charts */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/50 bg-card/30 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Activity className="w-4 h-4 text-primary" /> Active Deployments
               </CardTitle>
               <Badge variant="outline" className="text-[10px]">{persistentPositions?.length || 0} Open</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPositions ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !persistentPositions || persistentPositions.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-3">
                   <Zap className="w-12 h-12" />
                   <p className="text-sm font-medium">No active sessions found in Firestore.</p>
                   <Button variant="ghost" size="sm" onClick={() => setIsConfigOpen(true)}>Initialize Terminal Session</Button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {persistentPositions.map(pos => {
                    const sim = livePrices[pos.id] || { price: pos.entryPrice, pnl: 0, chart: [] }
                    return (
                      <div key={pos.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-white/[0.02] transition-all">
                        {/* Position Details */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${pos.side === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {pos.side === 'LONG' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="text-lg font-bold flex items-center gap-2">
                                  {pos.instrumentId}
                                  <Badge variant="outline" className="text-[9px] uppercase">{pos.strategyName}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Entry: ${pos.entryPrice.toLocaleString()} | Qty: {pos.quantity.toFixed(4)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-mono font-bold ${sim.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {sim.pnl >= 0 ? '+' : ''}{sim.pnl.toFixed(2)}%
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                Cur: ${sim.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] font-bold" disabled>
                               Modify TP/SL
                             </Button>
                             <Button 
                               variant="destructive" 
                               size="sm" 
                               className="flex-1 h-8 text-[11px] font-bold bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                               onClick={() => closePosition(pos.id)}
                             >
                               Exit Position
                             </Button>
                          </div>
                        </div>

                        {/* Position Chart Sparkline/Area */}
                        <div className="w-full md:w-64 h-32 bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={sim.chart}>
                                <defs>
                                  <linearGradient id={`color-${pos.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sim.pnl >= 0 ? "#38D94F" : "#F03C3C"} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={sim.pnl >= 0 ? "#38D94F" : "#F03C3C"} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <YAxis domain={['auto', 'auto']} hide />
                                <XAxis hide />
                                <Area 
                                  type="monotone" 
                                  dataKey="val" 
                                  stroke={sim.pnl >= 0 ? "#38D94F" : "#F03C3C"} 
                                  fillOpacity={1} 
                                  fill={`url(#color-${pos.id})`} 
                                  strokeWidth={2}
                                  isAnimationActive={false}
                                />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black border-primary/20 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-primary flex items-center gap-2">
                     <Terminal className="w-3 h-3" /> AUDIT_LOG_STREAM
                   </span>
                </div>
                <CardContent className="p-4 h-32 overflow-y-auto font-mono text-[10px] space-y-1">
                  {logs.length === 0 ? <div className="text-muted-foreground opacity-30">Waiting for system messages...</div> : null}
                  {logs.map((l, i) => (
                    <div key={i} className={l.includes('[CRITICAL]') ? 'text-red-400' : 'text-blue-300'}>
                      <span className="opacity-30 mr-2">{new Date().toLocaleTimeString()}</span> {l}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </CardContent>
              </Card>

              <Card className="bg-card/30 border-white/5">
                 <CardHeader className="py-3">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Active Compliance
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                    {[
                      { rule: "Weekend Holding", status: "Enabled", color: "text-primary" },
                      { rule: "Max Account Exposure", status: "Active", color: "text-primary" },
                      { rule: "Banned Pattern Scan", status: "Scanning", color: "text-primary" }
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded bg-background/50 border border-white/5">
                        <span className="text-muted-foreground">{r.rule}</span>
                        <span className={`font-bold uppercase ${r.color}`}>{r.status}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
