
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, PieChart, Wallet, ArrowUpCircle, 
  ArrowDownCircle, MoreHorizontal, History 
} from "lucide-react"

const allocations = [
  { name: 'Bitcoin (BTC)', value: '45%', amount: '$21,375.00', color: 'bg-orange-500' },
  { name: 'Ethereum (ETH)', value: '30%', amount: '$14,250.00', color: 'bg-blue-500' },
  { name: 'Solana (SOL)', value: '15%', amount: '$7,125.00', color: 'bg-purple-500' },
  { name: 'USDT (Cash)', value: '10%', amount: '$4,750.12', color: 'bg-green-500' },
]

export default function PortfolioPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analysis</h1>
          <p className="text-muted-foreground">Detailed breakdown of your assets and historical performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Performance History
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t">
            <div className="text-center text-muted-foreground">
               <History className="w-12 h-12 mx-auto mb-2 opacity-10" />
               <p>Detailed performance metrics rendering...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {allocations.map((asset) => (
                <div key={asset.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{asset.name}</span>
                    <span className="text-muted-foreground">{asset.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${asset.color}`} style={{ width: asset.value }}></div>
                    </div>
                    <span className="text-xs font-mono">{asset.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded">
                    {i % 2 === 0 ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{i % 2 === 0 ? 'Deposit' : 'Withdrawal'} via Coinbase</div>
                    <div className="text-xs text-muted-foreground">Oct {12 + i}, 2023 • 14:20 PM</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono">{i % 2 === 0 ? '+' : '-'}$1,200.00</div>
                  <Badge variant="outline" className="text-[10px]">Completed</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
