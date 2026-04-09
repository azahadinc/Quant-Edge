
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing, Settings, Plus, Trash2 } from "lucide-react"

const alerts = [
  { id: 1, type: 'Price', symbol: 'BTC/USDT', condition: 'Above $70,000', active: true },
  { id: 2, type: 'Indicator', symbol: 'ETH/USDT', condition: 'RSI < 30', active: true },
  { id: 3, type: 'Volume', symbol: 'SOL/USDT', condition: '24h Vol > 2B', active: false },
]

export default function AlertsPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategy Alerts</h1>
          <p className="text-muted-foreground">Configure triggers for market conditions and strategy events.</p>
        </div>
        <Button className="gap-2 bg-primary">
          <Plus className="w-4 h-4" /> Create Alert
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-4 h-4" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${alert.active ? 'bg-primary/10' : 'bg-muted'}`}>
                    {alert.active ? <BellRing className="w-5 h-5 text-primary" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{alert.symbol}</span>
                      <Badge variant="outline" className="text-[10px]">{alert.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{alert.condition}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notification Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">In-App Push</span>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Digest</span>
              <Badge variant="outline">Disabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Bot</span>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Webhook (Zapier)</span>
              <Badge variant="outline">Unconfigured</Badge>
            </div>
            <Button variant="outline" className="w-full mt-4">Manage Channels</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
