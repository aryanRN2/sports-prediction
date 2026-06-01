import { NextResponse } from 'next/server';
import { syncUpcomingMatches, checkAndSyncResults } from '@/lib/cricapi';

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Security
    const authHeader = request.headers.get('Authorization');
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In production, require the Bearer token matching Vercel's Cron Secret
    if (!isDevelopment && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Cron triggered: Syncing matches and results...');
    
    // 2. Perform Sync Operations
    const syncRes = await syncUpcomingMatches();
    const resultRes = await checkAndSyncResults();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      syncUpcoming: syncRes,
      checkResults: resultRes
    });
  } catch (error: any) {
    console.error('Cron sync failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Support POST requests as well
export async function POST(request: Request) {
  return GET(request);
}
