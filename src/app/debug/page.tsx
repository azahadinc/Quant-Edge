
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Terminal, Bug, Search, Filter, ShieldAlert, Cpu } from "lucide-react"

const logs = [
  { time: '14:20:01', level: 'INFO', msg: 'Connecting to Binance WebSocket...', source: 'CORE' },
  { time: '14:20:02', level: 'SUCCESS', msg: 'Auth successful. Receiving ticker stream.', source: 'API' },
  { time: '14:21:05', level: 'WARN', msg: 'Strategy "GoldenCross" delay detected (42ms).', source: 'STRAT' },
  { time: '14:21:10', level: 'ERROR', msg: 'Rate limit approaching on Order endpoint.', source: 'API' },
  { time: '14:22:00', level: 'DEBUG', msg: 'Memory usage: 142MB. CPU: 4.2%', source: 'SYS' },
]

export default function DebugConsolePage() {
  const [filter, setFilter] = useState("")

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Console</h1>
          <p className="text-muted-foreground">Low-level system logs and strategy trace information.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Trash2 className="w-4 h-4" /> Clear Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Resource Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span>CPU Usage</span><span>12%</span></div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="bg-primary h-full w-[12%]"></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span>RAM Usage</span><span>420MB</span></div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="bg-green-500 h-full w-[35%]"></div></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/5 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-500">
                <ShieldAlert className="w-4 h-4" /> System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-red-500/80">1 High Severity issue detected in API connectivity during last 5 mins.</div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-3 flex flex-col overflow-hidden bg-black/40 border-primary/20">
          <CardHeader className="border-b border-white/5 py-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono font-bold tracking-tighter">STDOUT_STREAM_V1</span>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..." 
                    className="h-7 pl-7 text-xs bg-muted/20 border-white/10" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
             </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto font-mono text-xs">
            <div className="p-4 space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
                  <span className="text-muted-foreground shrink-0">{log.time}</span>
                  <span className={`w-16 font-bold shrink-0 ${
                    log.level === 'ERROR' ? 'text-red-500' : 
                    log.level === 'WARN' ? 'text-yellow-500' : 
                    log.level === 'SUCCESS' ? 'text-green-500' : 'text-blue-500'
                  }`}>[{log.level}]</span>
                  <span className="text-muted-foreground w-12 shrink-0">{log.source}</span>
                  <span className="text-white/90">{log.msg}</span>
                </div>
              ))}
              <div className="pt-4 text-primary animate-pulse">_</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Trash2 } from 'lucide-react'
