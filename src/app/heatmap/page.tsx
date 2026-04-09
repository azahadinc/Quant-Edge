
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map as MapIcon, Maximize2, Layers } from "lucide-react"

const sectors = [
  { name: 'DeFi', change: '+4.2%', size: 'w-2/3', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { name: 'Layer 1', change: '+2.1%', size: 'w-1/3', color: 'bg-green-400/20 text-green-400 border-green-400/30' },
  { name: 'Metaverse', change: '-5.4%', size: 'w-1/2', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  { name: 'Storage', change: '+1.2%', size: 'w-1/2', color: 'bg-green-300/20 text-green-300 border-green-300/30' },
  { name: 'Oracles', change: '-1.8%', size: 'w-full', color: 'bg-red-400/20 text-red-400 border-red-400/30' },
]

export default function MarketMapPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Heatmap</h1>
          <p className="text-muted-foreground">Visual representation of market performance across all sectors.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-2">
            <Layers className="w-4 h-4" /> Market Cap Weight
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <Maximize2 className="w-4 h-4" /> Fullscreen
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[600px]">
        {sectors.map((sector) => (
          <Card key={sector.name} className={`flex flex-col border-2 transition-all hover:scale-[1.02] cursor-pointer ${sector.color}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{sector.name}</CardTitle>
              <span className="font-mono font-bold">{sector.change}</span>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <MapIcon className="w-12 h-12 opacity-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
