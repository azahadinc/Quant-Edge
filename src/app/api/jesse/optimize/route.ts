import { NextRequest, NextResponse } from 'next/server';
import { jesseService } from '@/services/jesse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      strategyName,
      startDate,
      endDate,
      initialCapital = 10000,
      generations = 50,
      population = 100
    } = body;

    if (!strategyName || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: strategyName, startDate, endDate' },
        { status: 400 }
      );
    }

    // Run Jesse optimization
    const result = await jesseService.optimizeStrategy(strategyName, {
      startDate,
      endDate,
      initialCapital,
      generations,
      population
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Optimization failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Jesse optimization API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}