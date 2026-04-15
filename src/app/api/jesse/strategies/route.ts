import { NextRequest, NextResponse } from 'next/server';
import { jesseService } from '@/services/jesse-service';
import { generateJesseStrategy } from '@/ai/flows/jesse-integration-flow';

// GET /api/jesse/strategies - List available strategies
export async function GET() {
  try {
    const strategies = await jesseService.listStrategies();
    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Error listing strategies:', error);
    return NextResponse.json(
      { error: 'Failed to list strategies' },
      { status: 500 }
    );
  }
}

// POST /api/jesse/strategies - Create a new strategy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (action === 'generate') {
      // Generate a new strategy using AI
      const result = await generateJesseStrategy(params);

      if (result.validationResult.valid) {
        // Save the strategy
        await jesseService.createStrategy(result.strategyName, result.code);
      }

      return NextResponse.json(result);
    }

    if (action === 'create' && params.name && params.code) {
      // Create strategy from provided code
      await jesseService.createStrategy(params.name, params.code);

      // Validate the strategy
      const validation = await jesseService.validateStrategy(params.code);

      return NextResponse.json({
        success: true,
        strategyName: params.name,
        validation
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}