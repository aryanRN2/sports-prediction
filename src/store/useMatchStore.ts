import { create } from 'zustand';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Prediction {
  id: string;
  matchId: string;
  homeWinConfidence: number;
  awayWinConfidence: number;
  predictedWinnerId: string;
  featureSnapshot: any; // Contains formHome, h2hHome, venueHome, formatHome, etc.
}

export interface Match {
  id: string;
  apiFixtureId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  format: 'TEST' | 'ODI' | 'T20';
  actualWinnerId?: string | null;
  completedAt?: string | null;
  homeTeam: Team;
  awayTeam: Team;
  venue: Venue;
  prediction?: Prediction | null;
}

interface MatchState {
  selectedMatchId: string | null;
  upcomingMatches: Match[];
  isCanvasLoading: boolean;
  setSelectedMatch: (matchId: string | null) => void;
  setUpcomingMatches: (matches: Match[]) => void;
  setCanvasLoading: (isLoading: boolean) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  selectedMatchId: null,
  upcomingMatches: [],
  isCanvasLoading: false,
  setSelectedMatch: (matchId) => set({ selectedMatchId: matchId }),
  setUpcomingMatches: (matches) => set({ upcomingMatches: matches }),
  setCanvasLoading: (isLoading) => set({ isCanvasLoading: isLoading }),
}));
