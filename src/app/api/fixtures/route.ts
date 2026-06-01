import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MatchStatus } from '@prisma/client';
import { syncUpcomingMatches } from '@/lib/cricapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Sync real matches from CricAPI in the background/inline
    try {
      await syncUpcomingMatches();
      console.log('CricAPI sync completed.');
    } catch (err) {
      console.error('Failed to sync real matches from CricAPI:', err);
    }

    // Always: fetch and return current SCHEDULED or LIVE matches
    const dbMatches = await prisma.match.findMany({
      where: {
        status: {
          in: [MatchStatus.SCHEDULED, MatchStatus.LIVE]
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        prediction: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ success: true, matches: dbMatches });

  } catch (error: any) {
    console.error('Failed to fetch/sync fixtures:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
