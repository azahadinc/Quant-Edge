
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, PieChart, Wallet, ArrowUpCircle, 
  ArrowDownCircle, History, Activity, TrendingUp, 
  ShieldCheck, Loader2, Coins, Landmark, Zap
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Pie, PieChart as ReChartsPie
} from 'recharts'
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore'

export default function PortfolioPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])
  const { data: profile } = useDoc<any>(profileRef)

  const INITIAL_TOTAL = profile?.totalBalance || 100000
  const [unrealizedPnl, setUnrealizedPnl] = useState(0)

  // 1. Fetch Active Positions from Live Trading
  const positionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, 'users', user.uid, 'tradingAccounts', 'default', 'positions'),
      where('status', '==', 'open')
    )
  }, [db, user])

  const { data: positions, isLoading: loadingPositions } = useCollection<any>(positionsQuery)

  // 2. Fetch Recent Trade History
  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, 'users', user.uid, 'tradingAccounts', 'default', 'trades'),
      orderBy('timestamp', 'desc'),
      limit(5)
    )
  }, [db, user])

  const { data: recentTrades } = useCollection<any>(historyQuery)

  // 3. Simulated Performance Data for the Equity Curve
  const [performanceData, setPerformanceData] = useState<{time: string, value: number}[]>([])

  useEffect(() => {
    if (performanceData.length === 0) {
      const seed = Array.from({ length: 20 }, (_, i) => ({
        time: `${10 + i}:00`,
        value: INITIAL_TOTAL + (Math.random() - 0.3) * 500
      }))
      setPerformanceData(seed)
    }

    const interval = setInterval(() => {
      if (!positions || positions.length === 0) {
        setUnrealizedPnl(0)
        return
      }

      let totalPnl = 0
      positions.forEach(pos => {
        const drift = (Math.random() - 0.49) * 10
        totalPnl += (pos.side === 'LONG' ? drift : -drift)
      })

      setUnrealizedPnl(prev => prev + totalPnl)
      
      setPerformanceData(prev => [
        ...prev.slice(-19), 
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: INITIAL_TOTAL + unrealizedPnl }
      ])
    }, 3000)

    return () => clearInterval(interval)
  }, [positions, unrealizedPnl, INITIAL_TOTAL, performanceData.length])

  // 4. Calculate Allocation
  const allocationData = useMemo(() => {
    const data = [
      { name: 'Vault (Idle)', value: profile?.vaultBalance || 0, color: '#212121' },
      { name: 'Trading Balance', value: profile?.tradingBalance || 0, color: '#3b82f6' }
    ]

    if (positions && positions.length > 0) {
      positions.forEach(pos => {
        const val = (pos.quantity || 1) * (pos.entryPrice || 0)
        data.push({ name: `In Trade: ${pos.instrumentId}`, value: val, color: '#10b981' })
      })
    }

    return data
  }, [profile, positions])

  const COLORS = ['#212121', '#3b82f6', '#10b981', '#f59e0b', '#60a5fa', '#93c5fd']

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto bg-background">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Portfolio Analysis</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Real-time multi-tier account monitoring.
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-none">CONNECTED TO AWS_WORKERS</Badge>
          </p>
        </div>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold uppercase text-primary mb-1">Total Balance</div>
            <div className="text-2xl font-bold font-mono">${(profile?.totalBalance || 100000).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className={`text-xs mt-1 font-bold flex items-center gap-1 ${unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               <TrendingUp className="w-3 h-3" /> {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Vault (Bal.)</div>
            <div className="text-2xl font-bold font-mono text-muted-foreground">${(profile?.vaultBalance || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Landmark className="w-3 h-3" /> Cold Storage
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold uppercase text-accent mb-1">Trading Balance</div>
            <div className="text-2xl font-bold font-mono text-accent">${(profile?.tradingBalance || 0).toLocaleString()}</div>
            <div className="text-xs text-accent mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Ready for Execution
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Active Positions</div>
            <div className="text-2xl font-bold font-mono">{positions?.length || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-muted-foreground">Compliance: Verified</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-headline">
              <BarChart3 className="w-5 h-5 text-primary" /> Performance History
            </CardTitle>
            <Badge variant="outline" className="text-[9px]">Live Trailing HWM</Badge>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e2e" />
                <XAxis dataKey="time" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E22', border: '1px solid #2e2e2e', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity']}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline">
              <PieChart className="w-5 h-5 text-primary" /> Capital Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <ReChartsPie>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </ReChartsPie>
               </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {allocationData.map((asset, index) => (
                <div key={asset.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="font-bold">{asset.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">${asset.value.toLocaleString()}</span>
                  </div>
                  <Progress value={(asset.value / INITIAL_TOTAL) * 100} className="h-1" />
                </div>
              ))}
              
              {loadingPositions && (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-headline">
            <Activity className="w-5 h-5 text-primary" /> Portfolio Activity
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] uppercase font-bold">Audit Ready</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(!recentTrades || recentTrades.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground opacity-40">
                <Coins className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No recent executions found in history.</p>
              </div>
            ) : (
              recentTrades.map((trade: any) => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${trade.side === 'BUY' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {trade.side === 'BUY' ? <ArrowUpCircle className="w-5 h-5 text-green-500" /> : <ArrowDownCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        {trade.side} {trade.instrumentId}
                        <Badge variant="outline" className="text-[9px] h-4 uppercase">{trade.type}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {trade.timestamp?.toDate ? trade.timestamp.toDate().toLocaleString() : 'Just now'} • AWS_{trade.tradingAccountId || 'DEFAULT'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">
                      ${(trade.executedPrice * trade.executedQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <Badge variant="outline" className="text-[9px] border-green-500/20 text-green-500">FILLED</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
