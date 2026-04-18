'use server';

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Binance API returned status ${response.status}` },
        { status: response.status }
      )
    }

    const tickerData = await response.json()

    return NextResponse.json({
      success: true,
      data: tickerData,
    })
  } catch (error: any) {
    console.error('Binance ticker fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch Binance ticker data' },
      { status: 500 }
    )
  }
}
