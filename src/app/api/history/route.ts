import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const completedMatches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        prediction: true,
      },
      orderBy: { scheduledAt: 'desc' }, // Show most recent completed matches first
    });

    // Calculate prediction accuracy metrics
    const total = completedMatches.length;
    let correct = 0;
    let wrong = 0;

    completedMatches.forEach(match => {
      if (match.prediction && match.actualWinnerId) {
        if (match.prediction.predictedWinnerId === match.actualWinnerId) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

    return NextResponse.json({
      success: true,
      stats: {
        total,
        correct,
        wrong,
        accuracy
      },
      matches: completedMatches
    });
  } catch (error: any) {
    console.error('Failed to retrieve prediction history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
