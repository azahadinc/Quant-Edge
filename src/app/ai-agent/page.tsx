"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bot, Send, Sparkles, Activity, ShieldCheck, 
  TrendingUp, Search, Loader2, BrainCircuit, Terminal
} from "lucide-react"
import { runTradingAgent, type TradingAgentOutput } from '@/ai/flows/trading-agent-flow'

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export default function AiAgentPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am the QuantEdge AI Orchestrator. I can coordinate Technical Analysis, Sentiment scanning, and Risk Management to help you execute trades. What would you like to analyze today?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const result = await runTradingAgent({ prompt: userMsg })
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.finalResponse,
        data: result.details 
      }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error while coordinating with my analysis agents. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col border-r border-border">
          <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">AI Command Center</h1>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Agents Online</span>
                </div>
              </div>
            </div>
          </header>

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 border border-border'
                  }`}>
                    {msg.content}
                    {msg.data && (
                      <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] space-y-2">
                         <div className="text-primary font-bold">ANALYSIS_PACKET_RECEIVED:</div>
                         <pre className="text-blue-300 overflow-x-auto">
                           {JSON.stringify(msg.data, null, 2)}
                         </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Orchestrating analysis agents...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card">
            <div className="max-w-3xl mx-auto relative">
              <Input 
                placeholder="Type a command (e.g. 'Analyze BTC sentiment and technicals')..." 
                className="pr-12 py-6 bg-background border-border/50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-2 top-2 h-8 w-8" 
                onClick={handleSend}
                disabled={isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="hidden lg:flex w-80 flex-col p-6 space-y-6 bg-card/30">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Active Agents</h3>
            <div className="space-y-3">
              {[
                { name: 'Technical Analyst', icon: Activity, status: 'Active', color: 'text-blue-400' },
                { name: 'Sentiment Scanner', icon: Search, status: 'Scanning', color: 'text-purple-400' },
                { name: 'Risk Manager', icon: ShieldCheck, status: 'Ready', color: 'text-green-400' }
              ].map((agent) => (
                <div key={agent.name} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center gap-3">
                    <agent.icon className={`w-4 h-4 ${agent.color}`} />
                    <span className="text-xs font-medium">{agent.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 h-4">{agent.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-primary">System Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The AI Orchestrator uses Multi-Agent reasoning to synthesize data from different domains before outputting trading signals.
              </p>
              <ul className="space-y-1">
                {['NL Trading Execution', 'Risk-Verified Signals', 'Cross-Asset Screening', 'Sentiment-Filtered TA'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[10px] text-primary">
                    <Sparkles className="w-2 h-2" /> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="mt-auto">
            <Card className="bg-black/40 border-primary/10">
              <CardContent className="p-3 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">v2.1 AGENT_ENGINE_ON</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
