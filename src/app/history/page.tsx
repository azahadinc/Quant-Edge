
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, History, Play, 
  ArrowUpRight, ArrowDownRight, 
  CheckCircle2, XCircle, Clock,
  CalendarDays, Trash2, Search
} from "lucide-react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function HistoryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Fetch Backtests
  const backtestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, 'users', user.uid, 'backtests'),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])
  const { data: backtests, isLoading: loadingBacktests } = useCollection<any>(backtestsQuery)

  // Fetch Trades (Completed positions would normally be here)
  const tradesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    // Assuming trades are recorded in this path upon completion
    return query(
      collection(db, 'users', user.uid, 'tradingAccounts', 'default', 'trades'),
      orderBy('timestamp', 'desc')
    )
  }, [db, user])
  const { data: trades, isLoading: loadingTrades } = useCollection<any>(tradesQuery)

  const handleDelete = async (type: 'backtest' | 'trade', id: string) => {
    if (!db || !user) return
    try {
      const path = type === 'backtest' 
        ? doc(db, 'users', user.uid, 'backtests', id)
        : doc(db, 'users', user.uid, 'tradingAccounts', 'default', 'trades', id)
      
      await deleteDoc(path)
      toast({ title: "Record Deleted", description: "The item has been removed from history." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting record" })
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto bg-background">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">History & Logs</h1>
          <p className="text-muted-foreground">Comprehensive track record of strategy performance and execution history.</p>
        </div>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="bg-card border border-border w-fit mb-4">
          <TabsTrigger value="live" className="gap-2 px-6">
            <Play className="w-4 h-4" /> Live Executions
          </TabsTrigger>
          <TabsTrigger value="backtest" className="gap-2 px-6">
            <History className="w-4 h-4" /> Backtest Sessions
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Filter by symbol or strategy..." className="pl-9 h-9" />
           </div>
           <Badge variant="outline" className="h-9 px-4 gap-2 border-primary/20 bg-primary/5">
             <CalendarDays className="w-3.5 h-3.5 text-primary" /> Last 30 Days
           </Badge>
        </div>

        <TabsContent value="live">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Live Trade Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] uppercase font-bold">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTrades ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Loading trade history...</TableCell></TableRow>
                  ) : !trades || trades.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No completed trades recorded in the current audit period.</TableCell></TableRow>
                  ) : (
                    trades.map((trade) => (
                      <TableRow key={trade.id} className="group">
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {trade.timestamp?.toDate ? trade.timestamp.toDate().toLocaleString() : 'Recent'}
                        </TableCell>
                        <TableCell className="font-bold">{trade.instrumentId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={trade.side === 'BUY' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}>
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">${trade.executedPrice?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{trade.executedQuantity}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-500/10 text-green-500 border-none">FILLED</Badge>
                        </TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive" onClick={() => handleDelete('trade', trade.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Strategy Simulation Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] uppercase font-bold">
                    <TableHead>Date</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Symbols</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBacktests ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Loading backtests...</TableCell></TableRow>
                  ) : !backtests || backtests.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No historical backtest sessions found.</TableCell></TableRow>
                  ) : (
                    backtests.map((bt) => (
                      <TableRow key={bt.id} className="group">
                        <TableCell className="text-xs text-muted-foreground">
                          {bt.createdAt?.toDate ? bt.createdAt.toDate().toLocaleDateString() : 'Today'}
                        </TableCell>
                        <TableCell className="font-bold">{bt.strategyId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {bt.instrumentIds?.map((id: string) => <Badge key={id} variant="outline" className="text-[9px] h-4">{id}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-500 font-bold">+12.4%</TableCell>
                        <TableCell className="text-right font-mono">68%</TableCell>
                        <TableCell className="text-center">
                          {bt.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />}
                        </TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive" onClick={() => handleDelete('backtest', bt.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
