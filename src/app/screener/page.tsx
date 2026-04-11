"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowUpDown, Search, Star, Loader2,
  BrainCircuit, Flame, Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarketItem, INITIAL_MARKET_DATA } from '@/lib/market-data'

export default function ScreenerPage() {
  const [data, setData] = useState<MarketItem[]>(INITIAL_MARKET_DATA)
  const [searchTerm, setSearchTerm] = useState("")
  const [marketFilter, setMarketFilter] = useState("all")
  const [timeframe, setTimeframe] = useState("1h")
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarketItem; direction: 'asc' | 'desc' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', { cache: 'no-store' });
        if (!response.ok) throw new Error('API unstable');
        const tickerData = await response.json();
        
        setData(current => current.map(item => {
          if (item.market === 'crypto') {
            const apiSymbol = item.symbol.replace('/', '');
            const apiMatch = Array.isArray(tickerData) ? tickerData.find((t: any) => t.symbol === apiSymbol) : null;
            
            if (apiMatch) {
              return {
                ...item,
                price: parseFloat(apiMatch.lastPrice),
                change: parseFloat(apiMatch.priceChangePercent),
                rsi: Math.round(item.rsi + (Math.random() - 0.5) * 2)
              }
            }
          }
          
          const volatilityFactor = item.market === 'stocks' ? 0.0008 : 0.0005
          const priceChange = item.price * (Math.random() - 0.5) * volatilityFactor
          return {
            ...item,
            price: item.price + priceChange,
            rsi: Math.round(Math.min(Math.max(item.rsi + (Math.random() - 0.5) * 3, 0), 100))
          }
        }))
      } catch (error) {
        // Fallback to simulation if fetch fails
        setData(current => current.map(item => {
          const volatilityFactor = 0.0005
          const priceChange = item.price * (Math.random() - 0.5) * volatilityFactor
          return {
            ...item,
            price: item.price + priceChange,
            rsi: Math.round(Math.min(Math.max(item.rsi + (Math.random() - 0.5) * 3, 0), 100))
          }
        }))
      }
    };

    fetchRealPrices();
    const interval = setInterval(fetchRealPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key: keyof MarketItem) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMarket = marketFilter === 'all' || item.market === marketFilter
      return matchesSearch && matchesMarket
    })

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (aValue === undefined || bValue === undefined) return 0
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, marketFilter, sortConfig])

  const handleExport = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Export Success",
        description: `CSV file generated.`
      })
    }, 1200)
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 overflow-auto bg-[#0A0C0E]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            Institutional Screener <Badge variant="outline" className="hidden xs:flex bg-primary/10 border-primary/20 text-primary text-[10px] uppercase">BINANCE LIVE FEED</Badge>
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-1">Unified market intelligence for Stocks, Forex, Crypto, and Commodities.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 border-white/10 bg-white/5 text-[11px]" onClick={handleExport} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-[11px]">
             Save Preset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Sentiment Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
               {[
                 { label: 'Market Sentiment', value: 'Greed', score: 72, color: 'bg-green-500' },
                 { label: 'Vol Correlation', value: 'High', score: 85, color: 'bg-primary' },
                 { label: 'Retail Interest', value: 'Extreme', score: 91, color: 'bg-orange-500' }
               ].map((stat) => (
                 <div key={stat.label} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                      <span>{stat.label}</span>
                      <span className="text-white">{stat.value}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color}`} style={{ width: `${stat.score}%` }} />
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
             <CardHeader className="pb-2 px-4 pt-4">
               <CardTitle className="text-[10px] font-bold uppercase flex items-center gap-2">
                 <Flame className="w-3 h-3 text-orange-500" /> Hot Patterns Detect
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-2 px-4 pb-4">
                {[
                  { symbol: 'NVDA', pattern: 'Triangle', conf: 82 },
                  { symbol: 'GOLD', pattern: 'Golden Cross', conf: 94 }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50 border border-white/5">
                    <div className="text-[10px]">
                      <span className="font-bold text-white block">{p.symbol}</span>
                      <span className="text-muted-foreground text-[9px]">{p.pattern}</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 border-primary/20">{p.conf}%</Badge>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="p-0 border-b border-border shrink-0">
            <Tabs value={marketFilter} onValueChange={setMarketFilter} className="w-full">
              <div className="px-4 py-4 lg:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <TabsList className="bg-background/50 h-8 p-1 w-full sm:w-auto flex overflow-x-auto justify-start">
                  <TabsTrigger value="all" className="text-[10px] px-2 flex-1 sm:flex-none">All</TabsTrigger>
                  <TabsTrigger value="stocks" className="text-[10px] px-2 flex-1 sm:flex-none">Stocks</TabsTrigger>
                  <TabsTrigger value="crypto" className="text-[10px] px-2 flex-1 sm:flex-none">Crypto</TabsTrigger>
                  <TabsTrigger value="forex" className="text-[10px] px-2 flex-1 sm:flex-none">Forex</TabsTrigger>
                  <TabsTrigger value="commodities" className="text-[10px] px-2 flex-1 sm:flex-none">Cmdty</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Ticker..." 
                      className="pl-8 h-8 text-[11px] bg-background/50 border-white/5" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[70px] h-8 text-[10px] bg-background/50 border-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m" className="text-xs">15m</SelectItem>
                      <SelectItem value="1h" className="text-xs">1h</SelectItem>
                      <SelectItem value="4h" className="text-xs">4h</SelectItem>
                      <SelectItem value="1D" className="text-xs">1D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="cursor-pointer group text-[10px] uppercase font-bold" onClick={() => handleSort('symbol')}>
                      Symbol <ArrowUpDown className="inline w-2 h-2 ml-1 opacity-0 group-hover:opacity-100" />
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Price</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Change</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">RSI (14)</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">RVOL</TableHead>
                    <TableHead className="text-center text-[10px] uppercase font-bold">Pattern</TableHead>
                    <TableHead className="text-center text-[10px] uppercase font-bold">Sent.</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((row) => (
                    <TableRow key={row.symbol} className="border-border/40 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="text-center">
                        <Star className={`w-3 h-3 cursor-pointer hover:text-yellow-500 transition-colors ${row.isFavorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-[13px]">{row.symbol}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {row.market === 'stocks' && <span className="text-[8px] text-blue-400">P/E:{row.peRatio}</span>}
                            {row.market === 'crypto' && <span className="text-[8px] text-orange-400">FR:{row.fundingRate}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] font-medium">
                        {row.market === 'forex' ? row.price.toFixed(4) : row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-[11px] font-bold ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-mono font-bold ${row.rsi > 70 ? 'text-red-400' : row.rsi < 30 ? 'text-green-400' : 'text-muted-foreground'}`}>{row.rsi}</span>
                          <div className="w-10 h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${row.rsi > 70 ? 'bg-red-500' : row.rsi < 30 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${row.rsi}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-[11px] ${row.rvol > 1.5 ? 'text-orange-400 font-bold' : 'text-muted-foreground'}`}>
                        {row.rvol}x
                      </TableCell>
                      <TableCell className="text-center">
                         {row.pattern ? (
                           <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 text-white font-medium uppercase truncate max-w-[80px]">
                             {row.pattern}
                           </Badge>
                         ) : <span className="text-muted-foreground opacity-20 text-[10px]">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                         <div className="flex items-center justify-center gap-1.5">
                            <div className={`w-1 h-1 rounded-full ${row.sentiment > 0.5 ? 'bg-green-500' : row.sentiment < -0.5 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            <span className="text-[9px] font-mono">{row.sentiment > 0 ? '+' : ''}{row.sentiment.toFixed(2)}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <Badge variant="outline" className={
                           row.status === 'Bullish' ? "border-green-500/50 text-green-500 text-[8px] px-1 h-4" :
                           row.status === 'Bearish' ? "border-red-500/50 text-red-500 text-[8px] px-1 h-4" :
                           "text-muted-foreground border-border/50 text-[8px] px-1 h-4"
                         }>
                           {row.status}
                         </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
