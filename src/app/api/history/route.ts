import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MatchStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch completed matches with prediction, home team, away team, and venue info
    const completedMatches = await prisma.match.findMany({
      where: {
        status: MatchStatus.COMPLETED
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        prediction: true
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });
    
    // 2. Compute accuracy percentage
    let total = 0;
    let correct = 0;
    
    completedMatches.forEach(match => {
      if (match.prediction && match.actualWinnerId) {
        total++;
        if (match.prediction.predictedWinnerId === match.actualWinnerId) {
          correct++;
        }
      }
    });
    
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return NextResponse.json({
      success: true,
      matches: completedMatches,
      accuracy,
      totalPredictions: total,
      correctPredictions: correct
    });
  } catch (error: any) {
    console.error('Failed to fetch history predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
