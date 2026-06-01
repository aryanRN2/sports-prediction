import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MatchFormat, MatchStatus } from '@prisma/client';
import { calculatePrediction } from '@/lib/predictor';

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

    // 1. Always seed/sync Teams to ensure latest official logos are active
    dbTeams = [];
    for (const t of TEAMS) {
      const teamObj = await prisma.team.upsert({
        where: { name: t.name },
        update: {
          logoUrl: t.logoUrl,
        },
        create: {
          name: t.name,
          shortName: t.shortName,
          logoUrl: t.logoUrl,
        },
      });
      dbTeams.push(teamObj);
    }

    // 2. Always seed/sync Venues
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

    // Seeding trigger: If matches are empty, seed mock fixtures and predictions
    if (dbMatches.length === 0) {
      console.log('Seeding upcoming fixtures and predictions...');
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
