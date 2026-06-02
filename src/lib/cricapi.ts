import { prisma } from './db';
import { MatchFormat, MatchStatus } from '@prisma/client';
import { calculatePrediction } from './predictor';

const CRICAPI_KEY = process.env.CRICAPI_KEY || 'a32565e8-b4bc-49ec-8bf5-8480e7f172b5';

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'india': { lat: 20.5937, lng: 78.9629 },
  'australia': { lat: -25.2744, lng: 133.7751 },
  'england': { lat: 55.3781, lng: -3.4360 },
  'pakistan': { lat: 30.3753, lng: 69.3451 },
  'south africa': { lat: -30.5595, lng: 22.9375 },
  'new zealand': { lat: -40.9006, lng: 174.8860 },
  'sri lanka': { lat: 7.8731, lng: 80.7718 },
  'bangladesh': { lat: 23.6850, lng: 90.3563 },
  'west indies': { lat: 13.1939, lng: -59.5432 },
  'afghanistan': { lat: 33.9391, lng: 67.7100 },
  'ireland': { lat: 53.4129, lng: -8.2439 },
  'zimbabwe': { lat: -19.0154, lng: 29.1549 },
  'malaysia': { lat: 4.2105, lng: 101.9758 },
  'sweden': { lat: 60.1282, lng: 18.6435 },
  'portugal': { lat: 39.3999, lng: -8.2245 },
  'netherlands': { lat: 52.1326, lng: 5.2913 },
  'scotland': { lat: 56.4907, lng: -4.2026 },
  'nepal': { lat: 28.3949, lng: 84.1240 },
  'oman': { lat: 21.5125, lng: 55.9233 },
  'uae': { lat: 23.4241, lng: 53.8478 },
  'usa': { lat: 37.0902, lng: -95.7129 },
  'canada': { lat: 56.1304, lng: -106.3468 },
};

function getVenueCoordinates(venueName: string): { city: string; country: string; latitude: number; longitude: number } {
  const parts = venueName.split(',').map(p => p.trim());
  let country = parts[parts.length - 1] || 'Unknown';
  let city = parts[parts.length - 2] || country;
  
  const countryLower = country.toLowerCase();
  let lat = 0.0;
  let lng = 0.0;
  
  for (const [key, coords] of Object.entries(COUNTRY_COORDINATES)) {
    if (countryLower.includes(key) || venueName.toLowerCase().includes(key)) {
      country = key.toUpperCase();
      lat = coords.lat;
      lng = coords.lng;
      break;
    }
  }
  
  // If coordinates not found, generate a deterministic fallback based on venueName hash
  if (lat === 0.0 && lng === 0.0) {
    let hash = 0;
    for (let i = 0; i < venueName.length; i++) {
      hash = (hash << 5) - hash + venueName.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    lat = 10.0 + (absHash % 40); // 10 to 50
    lng = -30.0 + (absHash % 150); // -30 to 120
  }
  
  return { city, country, latitude: lat, longitude: lng };
}

function mapMatchType(matchType: string): MatchFormat {
  const type = matchType?.toLowerCase() || '';
  if (type.includes('test')) return MatchFormat.TEST;
  if (type.includes('odi')) return MatchFormat.ODI;
  return MatchFormat.T20; // Default fallback (T20 represents shortest format/variety)
}

export async function syncUpcomingMatches(force = false) {
  try {
    if (!force) {
      // Check if we already did a sync/prediction today
      const lastPrediction = await prisma.prediction.findFirst({
        orderBy: { calculatedAt: 'desc' }
      });
      
      if (lastPrediction) {
        const lastSyncTime = new Date(lastPrediction.calculatedAt);
        const now = new Date();
        const isSameDay = lastSyncTime.toDateString() === now.toDateString();
        if (isSameDay) {
          console.log('Matches and predictions already synced today. Skipping CricAPI fetch.');
          return { success: true, count: 0, skipped: true };
        }
      }
    }

    const url = `https://api.cricapi.com/v1/matches?apikey=${CRICAPI_KEY}&offset=0`;
    const res = await fetch(url);
    const result = await res.json();
    
    if (result.status !== 'success') {
      throw new Error(`CricAPI returned status ${result.status}: ${JSON.stringify(result)}`);
    }
    
    const apiMatches = result.data || [];
    const addedMatches = [];
    
    for (const match of apiMatches) {
      // 1. Basic validation
      if (!match.id || !match.teams || match.teams.length < 2) continue;
      
      // 2. Format & Date validation
      const format = mapMatchType(match.matchType);
      const scheduledAt = new Date(match.dateTimeGMT || match.date);
      
      // Filter out matches that are too far in the future or in the past
      const now = new Date();
      const diffDays = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Only import matches happening in next 30 days, or matches started but not finished, or matches of current day
      if (diffDays > 30 || (match.matchEnded && diffDays < -2)) continue;
      
      // 3. Find or create teams
      const team1Name = match.teams[0];
      const team2Name = match.teams[1];
      
      const team1Info = match.teamInfo?.find((t: any) => t.name === team1Name) || {};
      const team2Info = match.teamInfo?.find((t: any) => t.name === team2Name) || {};
      
      const homeTeam = await prisma.team.upsert({
        where: { name: team1Name },
        update: team1Info.img ? { logoUrl: team1Info.img } : {},
        create: {
          name: team1Name,
          shortName: team1Info.shortname || team1Name.substring(0, 3).toUpperCase(),
          logoUrl: team1Info.img || null
        }
      });
      
      const awayTeam = await prisma.team.upsert({
        where: { name: team2Name },
        update: team2Info.img ? { logoUrl: team2Info.img } : {},
        create: {
          name: team2Name,
          shortName: team2Info.shortname || team2Name.substring(0, 3).toUpperCase(),
          logoUrl: team2Info.img || null
        }
      });
      
      // 4. Find or create venue
      const venueName = match.venue || 'International Cricket Stadium';
      const coords = getVenueCoordinates(venueName);
      
      const venue = await prisma.venue.upsert({
        where: { name: venueName },
        update: {},
        create: {
          name: venueName,
          city: coords.city,
          country: coords.country,
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      });
      
      // 5. Determine match status
      let status: MatchStatus = MatchStatus.SCHEDULED;
      if (match.matchEnded) {
        status = MatchStatus.COMPLETED;
      } else if (match.matchStarted) {
        status = MatchStatus.LIVE;
      }
      
      // 6. Upsert the match
      const dbMatch = await prisma.match.upsert({
        where: { apiFixtureId: match.id },
        update: {
          scheduledAt,
          status,
          format
        },
        create: {
          apiFixtureId: match.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          venueId: venue.id,
          scheduledAt,
          format,
          status
        }
      });
      
      // 7. Calculate and create prediction if it does not exist yet
      const existingPred = await prisma.prediction.findUnique({
        where: { matchId: dbMatch.id }
      });
      
      if (!existingPred) {
        const predResult = await calculatePrediction(dbMatch.id);
        await prisma.prediction.create({
          data: {
            matchId: dbMatch.id,
            homeWinConfidence: predResult.homeWinConfidence,
            awayWinConfidence: predResult.awayWinConfidence,
            predictedWinnerId: predResult.predictedWinnerId,
            featureSnapshot: predResult.features
          }
        });
      }
      
      addedMatches.push(dbMatch);
    }
    
    return { success: true, count: addedMatches.length };
  } catch (err: any) {
    console.error('Error syncing upcoming matches:', err);
    throw err;
  }
}

export async function checkAndSyncResults() {
  try {
    // Find all matches in the database that are SCHEDULED or LIVE but are passed their scheduled time
    const now = new Date();
    // A match starts and can last anywhere from 3 hours (T20) to 8 hours (ODI) or 5 days (Test)
    // We check matches where scheduled time is older than 4 hours
    const cutOffTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    
    const activeMatches = await prisma.match.findMany({
      where: {
        status: {
          in: [MatchStatus.SCHEDULED, MatchStatus.LIVE]
        },
        scheduledAt: {
          lt: cutOffTime
        }
      }
    });
    
    console.log(`Checking results for ${activeMatches.length} pending matches...`);
    let completedCount = 0;
    
    for (const match of activeMatches) {
      const url = `https://api.cricapi.com/v1/match_info?apikey=${CRICAPI_KEY}&id=${match.apiFixtureId}`;
      const res = await fetch(url);
      const result = await res.json();
      
      if (result.status !== 'success' || !result.data) continue;
      
      const matchData = result.data;
      
      if (matchData.matchEnded) {
        // Find winner ID
        let actualWinnerId = null;
        const winnerName = matchData.matchWinner;
        
        if (winnerName) {
          const dbWinnerTeam = await prisma.team.findUnique({
            where: { name: winnerName }
          });
          if (dbWinnerTeam) {
            actualWinnerId = dbWinnerTeam.id;
          }
        }
        
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: MatchStatus.COMPLETED,
            actualWinnerId,
            completedAt: new Date()
          }
        });
        
        completedCount++;
      } else if (matchData.matchStarted && match.status === MatchStatus.SCHEDULED) {
        // If it has started, mark as LIVE
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: MatchStatus.LIVE
          }
        });
      }
    }
    
    return { success: true, completedCount };
  } catch (err) {
    console.error('Error checking and syncing results:', err);
    throw err;
  }
}
