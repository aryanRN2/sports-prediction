import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MatchFormat, MatchStatus } from '@prisma/client';
import { calculatePrediction } from '@/lib/predictor';

// Seed datasets for cricket teams
const TEAMS = [
  { name: 'India', shortName: 'IND', logoUrl: 'https://images.unsplash.com/photo-1531415080290-bc9b08f4c229?w=100&h=100&fit=crop&q=80' },
  { name: 'Australia', shortName: 'AUS', logoUrl: 'https://images.unsplash.com/photo-1540747737956-37872564fec0?w=100&h=100&fit=crop&q=80' },
  { name: 'England', shortName: 'ENG', logoUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop&q=80' },
  { name: 'Pakistan', shortName: 'PAK', logoUrl: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=100&h=100&fit=crop&q=80' },
  { name: 'South Africa', shortName: 'RSA', logoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&h=100&fit=crop&q=80' },
  { name: 'New Zealand', shortName: 'NZL', logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop&q=80' },
];

// Seed datasets for stadiums with latitude and longitude
const VENUES = [
  { name: 'Wankhede Stadium', city: 'Mumbai', country: 'India', latitude: 18.9389, longitude: 72.8258 },
  { name: 'Melbourne Cricket Ground', city: 'Melbourne', country: 'Australia', latitude: -37.8200, longitude: 144.9834 },
  { name: 'Lord\'s Cricket Ground', city: 'London', country: 'England', latitude: 51.5319, longitude: -0.1712 },
  { name: 'Gaddafi Stadium', city: 'Lahore', country: 'Pakistan', latitude: 31.5126, longitude: 74.3317 },
  { name: 'Newlands Cricket Ground', city: 'Cape Town', country: 'South Africa', latitude: -33.9785, longitude: 18.4688 },
  { name: 'Eden Park', city: 'Auckland', country: 'New Zealand', latitude: -36.8749, longitude: 174.7423 },
];

// Setup scheduled fixtures
const MOCK_FIXTURES = [
  { homeIndex: 0, awayIndex: 1, venueIndex: 0, format: MatchFormat.T20, daysOffset: 1, apiId: 'fixt-01' }, // IND vs AUS at Mumbai
  { homeIndex: 2, awayIndex: 3, venueIndex: 2, format: MatchFormat.TEST, daysOffset: 3, apiId: 'fixt-02' }, // ENG vs PAK at London
  { homeIndex: 4, awayIndex: 5, venueIndex: 4, format: MatchFormat.ODI, daysOffset: 5, apiId: 'fixt-03' }, // RSA vs NZL at Cape Town
  { homeIndex: 1, awayIndex: 2, venueIndex: 1, format: MatchFormat.ODI, daysOffset: 7, apiId: 'fixt-04' }, // AUS vs ENG at Melbourne
  { homeIndex: 0, awayIndex: 4, venueIndex: 0, format: MatchFormat.T20, daysOffset: 9, apiId: 'fixt-05' }, // IND vs RSA at Mumbai
  { homeIndex: 3, awayIndex: 5, venueIndex: 3, format: MatchFormat.T20, daysOffset: 11, apiId: 'fixt-06' }, // PAK vs NZL at Lahore
];

export async function GET() {
  try {
    // Check if we have teams, venues, and matches seeded
    let dbTeams = await prisma.team.findMany();
    let dbVenues = await prisma.venue.findMany();
    let dbMatches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        prediction: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Seeding trigger: If empty database, auto-seed with beautiful high-fidelity data
    if (dbTeams.length === 0 || dbVenues.length === 0 || dbMatches.length === 0) {
      console.log('Database empty. Seeding teams, venues, and fixtures...');

      // 1. Seed Teams
      dbTeams = [];
      for (const t of TEAMS) {
        const teamObj = await prisma.team.upsert({
          where: { name: t.name },
          update: {},
          create: {
            name: t.name,
            shortName: t.shortName,
            logoUrl: t.logoUrl,
          },
        });
        dbTeams.push(teamObj);
      }

      // 2. Seed Venues
      dbVenues = [];
      for (const v of VENUES) {
        const venueObj = await prisma.venue.upsert({
          where: { name: v.name },
          update: {},
          create: {
            name: v.name,
            city: v.city,
            country: v.country,
            latitude: v.latitude,
            longitude: v.longitude,
          },
        });
        dbVenues.push(venueObj);
      }

      // 3. Seed Fixtures
      const now = new Date();
      for (const f of MOCK_FIXTURES) {
        const homeTeam = dbTeams.find(t => t.name === TEAMS[f.homeIndex].name);
        const awayTeam = dbTeams.find(t => t.name === TEAMS[f.awayIndex].name);
        const venue = dbVenues.find(v => v.name === VENUES[f.venueIndex].name);

        if (homeTeam && awayTeam && venue) {
          const scheduledAt = new Date(now.getTime() + f.daysOffset * 24 * 60 * 60 * 1000);
          
          const matchObj = await prisma.match.upsert({
            where: { apiFixtureId: f.apiId },
            update: {
              scheduledAt,
              status: MatchStatus.SCHEDULED,
            },
            create: {
              apiFixtureId: f.apiId,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              venueId: venue.id,
              scheduledAt,
              format: f.format,
              status: MatchStatus.SCHEDULED,
            },
          });

          // Run prediction computation deterministically right after saving match
          const predResult = await calculatePrediction(matchObj.id);
          await prisma.prediction.upsert({
            where: { matchId: matchObj.id },
            update: {
              homeWinConfidence: predResult.homeWinConfidence,
              awayWinConfidence: predResult.awayWinConfidence,
              predictedWinnerId: predResult.predictedWinnerId,
              featureSnapshot: predResult.features,
            },
            create: {
              matchId: matchObj.id,
              homeWinConfidence: predResult.homeWinConfidence,
              awayWinConfidence: predResult.awayWinConfidence,
              predictedWinnerId: predResult.predictedWinnerId,
              featureSnapshot: predResult.features,
            },
          });
        }
      }

      // Fetch newly seeded matches
      dbMatches = await prisma.match.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
          venue: true,
          prediction: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      matches: dbMatches,
    });
  } catch (error: any) {
    console.error('Failed to fetch/sync fixtures:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Sync upcoming fixtures simulation endpoint
  return GET();
}
