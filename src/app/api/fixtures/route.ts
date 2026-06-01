import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MatchFormat, MatchStatus } from '@prisma/client';
import { calculatePrediction } from '@/lib/predictor';
import { syncUpcomingMatches } from '@/lib/cricapi';

export const dynamic = 'force-dynamic';

// Seed datasets for cricket teams
const TEAMS = [
  { name: 'India', shortName: 'IND', logoUrl: '/logos/india.png' },
  { name: 'Australia', shortName: 'AUS', logoUrl: '/logos/australia.png' },
  { name: 'England', shortName: 'ENG', logoUrl: '/logos/england.png' },
  { name: 'Pakistan', shortName: 'PAK', logoUrl: '/logos/pakistan.png' },
  { name: 'South Africa', shortName: 'RSA', logoUrl: '/logos/south_africa.png' },
  { name: 'New Zealand', shortName: 'NZL', logoUrl: '/logos/new_zealand.png' },
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

// Setup completed fixtures for history testing
const MOCK_COMPLETED_FIXTURES = [
  { homeIndex: 0, awayIndex: 1, venueIndex: 0, format: MatchFormat.T20, daysOffset: -2, apiId: 'fixt-comp-01', winnerIndex: 0 }, // IND vs AUS at Mumbai (Winner: IND, Prediction: IND - CORRECT)
  { homeIndex: 2, awayIndex: 3, venueIndex: 2, format: MatchFormat.TEST, daysOffset: -4, apiId: 'fixt-comp-02', winnerIndex: 2 }, // ENG vs PAK at London (Winner: ENG, Prediction was PAK (seed-based) - WRONG)
  { homeIndex: 4, awayIndex: 5, venueIndex: 4, format: MatchFormat.ODI, daysOffset: -6, apiId: 'fixt-comp-03', winnerIndex: 5 }, // RSA vs NZL at Cape Town (Winner: NZL, Prediction: NZL - CORRECT)
];

export async function GET() {
  try {
    // Check if the mock fixtures are already seeded (by looking for our mock API IDs)
    const mockMatchCount = await prisma.match.count({
      where: {
        apiFixtureId: {
          in: [...MOCK_FIXTURES.map(f => f.apiId), ...MOCK_COMPLETED_FIXTURES.map(f => f.apiId)]
        }
      }
    });
    const expectedMockCount = MOCK_FIXTURES.length + MOCK_COMPLETED_FIXTURES.length;

    // ─── Seed path: runs if any of our expected mock fixtures are missing ───────────────────────────
    if (mockMatchCount < expectedMockCount) {
      console.log('Seeding/Restoring missing mock matches and history fixtures...');
      
      // Always seed teams first so we have referenceable team IDs
      const dbTeams = await Promise.all(
        TEAMS.map(t =>
          prisma.team.upsert({
            where: { name: t.name },
            update: { logoUrl: t.logoUrl },
            create: { name: t.name, shortName: t.shortName, logoUrl: t.logoUrl },
          })
        )
      );

      // Always seed venues
      const dbVenues = await Promise.all(
        VENUES.map(v =>
          prisma.venue.upsert({
            where: { name: v.name },
            update: {},
            create: {
              name: v.name,
              city: v.city,
              country: v.country,
              latitude: v.latitude,
              longitude: v.longitude,
            },
          })
        )
      );

      // Seed mock upcoming matches (always seed these so they are guaranteed to be in the predictions)
      const now = new Date();
      for (const f of MOCK_FIXTURES) {
        const homeTeam = dbTeams.find(t => t.name === TEAMS[f.homeIndex].name);
        const awayTeam = dbTeams.find(t => t.name === TEAMS[f.awayIndex].name);
        const venue = dbVenues.find(v => v.name === VENUES[f.venueIndex].name);

        if (homeTeam && awayTeam && venue) {
          const scheduledAt = new Date(now.getTime() + f.daysOffset * 24 * 60 * 60 * 1000);

          const matchObj = await prisma.match.upsert({
            where: { apiFixtureId: f.apiId },
            update: { scheduledAt, status: MatchStatus.SCHEDULED },
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

      // Try syncing other real matches from CricAPI in the background as additional fixtures
      try {
        await syncUpcomingMatches();
        console.log('CricAPI sync completed.');
      } catch (err) {
        console.error('Failed to sync real matches from CricAPI:', err);
      }

      // Seed mock COMPLETED matches (always seed these so the history page is populated)
      for (const f of MOCK_COMPLETED_FIXTURES) {
        const homeTeam = dbTeams.find(t => t.name === TEAMS[f.homeIndex].name);
        const awayTeam = dbTeams.find(t => t.name === TEAMS[f.awayIndex].name);
        const venue = dbVenues.find(v => v.name === VENUES[f.venueIndex].name);
        const winnerTeam = dbTeams.find(t => t.name === TEAMS[f.winnerIndex].name);

        if (homeTeam && awayTeam && venue && winnerTeam) {
          const scheduledAt = new Date(now.getTime() + f.daysOffset * 24 * 60 * 60 * 1000);
          const completedAt = new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours after start

          const matchObj = await prisma.match.upsert({
            where: { apiFixtureId: f.apiId },
            update: {
              scheduledAt,
              status: MatchStatus.COMPLETED,
              actualWinnerId: winnerTeam.id,
              completedAt,
            },
            create: {
              apiFixtureId: f.apiId,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              venueId: venue.id,
              scheduledAt,
              format: f.format,
              status: MatchStatus.COMPLETED,
              actualWinnerId: winnerTeam.id,
              completedAt,
            },
          });

          // Run and store prediction details
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
    }

    // ─── Always: fetch and return current SCHEDULED or LIVE matches ───────────
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
