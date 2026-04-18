'use server';

import { NextRequest, NextResponse } from 'next/server'
import { testAlpacaConnection } from '@/app/actions/alpaca-actions'

export async function POST(request: NextRequest) {
  try {
    const { keyId, secretKey, paper = true } = await request.json()

    if (!keyId || !secretKey) {
      return NextResponse.json(
        { success: false, error: 'Alpaca API key and secret are required' },
        { status: 400 }
      )
    }

    const result = await testAlpacaConnection({ keyId, secretKey, paper })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Alpaca connection failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      buyingPower: result.buyingPower,
    })
  } catch (error: any) {
    console.error('Alpaca connection test error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
