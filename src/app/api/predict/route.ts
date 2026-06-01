import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculatePrediction } from '@/lib/predictor';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'Missing matchId query parameter' },
        { status: 400 }
      );
    }

    // Trigger deterministic prediction inference
    const predictionResult = await calculatePrediction(matchId);

    // Save calculation to the database
    const savedPrediction = await prisma.prediction.upsert({
      where: { matchId },
      update: {
        homeWinConfidence: predictionResult.homeWinConfidence,
        awayWinConfidence: predictionResult.awayWinConfidence,
        predictedWinnerId: predictionResult.predictedWinnerId,
        featureSnapshot: predictionResult.features,
        calculatedAt: new Date(),
      },
      create: {
        matchId,
        homeWinConfidence: predictionResult.homeWinConfidence,
        awayWinConfidence: predictionResult.awayWinConfidence,
        predictedWinnerId: predictionResult.predictedWinnerId,
        featureSnapshot: predictionResult.features,
      },
    });

    return NextResponse.json({
      success: true,
      prediction: savedPrediction,
    });
  } catch (error: any) {
    console.error('Prediction inference failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
