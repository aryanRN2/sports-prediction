'use client';

import React, { useEffect, useState } from 'react';
import { useMatchStore, Match } from '@/store/useMatchStore';
import { fetchJson } from '@/lib/api-client';
import { 
  Calendar, 
  MapPin, 
  Award, 
  ShieldAlert,
  ArrowRightLeft,
  Users,
  Star,
  TrendingUp,
  Tv
} from 'lucide-react';

type Player = { name: string; role: 'BAT' | 'BWL' | 'ALL' | 'WK'; rating: number };

// Format-specific Probable Playing XI — researched from 2026 ICC squads (June 2026)
// KEY RETIREMENTS: Rohit/Kohli/Jadeja (IND T20+TEST), David Warner/Starc (AUS T20),
// Kane Williamson (NZ T20, Nov 2025), Heinrich Klaasen (SA all cricket, Jun 2025)
const TEAM_SQUADS: Record<string, Record<string, Player[]>> = {
  India: {
    T20: [
      { name: 'Suryakumar Yadav (c)', role: 'BAT', rating: 95 },
      { name: 'Abhishek Sharma', role: 'BAT', rating: 84 },
      { name: 'Sanju Samson', role: 'WK', rating: 86 },
      { name: 'Tilak Varma', role: 'BAT', rating: 83 },
      { name: 'Rinku Singh', role: 'BAT', rating: 80 },
      { name: 'Hardik Pandya', role: 'ALL', rating: 89 },
      { name: 'Axar Patel (vc)', role: 'ALL', rating: 87 },
      { name: 'Washington Sundar', role: 'ALL', rating: 79 },
      { name: 'Jasprit Bumrah', role: 'BWL', rating: 98 },
      { name: 'Arshdeep Singh', role: 'BWL', rating: 85 },
      { name: 'Varun Chakaravarthy', role: 'BWL', rating: 82 },
    ],
    ODI: [
      { name: 'Rohit Sharma (c)', role: 'BAT', rating: 93 },
      { name: 'Shubman Gill', role: 'BAT', rating: 89 },
      { name: 'Virat Kohli', role: 'BAT', rating: 96 },
      { name: 'Shreyas Iyer', role: 'BAT', rating: 84 },
      { name: 'KL Rahul', role: 'WK', rating: 86 },
      { name: 'Hardik Pandya', role: 'ALL', rating: 89 },
      { name: 'Ravindra Jadeja', role: 'ALL', rating: 88 },
      { name: 'Kuldeep Yadav', role: 'BWL', rating: 86 },
      { name: 'Jasprit Bumrah', role: 'BWL', rating: 98 },
      { name: 'Mohammed Siraj', role: 'BWL', rating: 84 },
      { name: 'Arshdeep Singh', role: 'BWL', rating: 83 },
    ],
    TEST: [
      { name: 'Yashasvi Jaiswal', role: 'BAT', rating: 90 },
      { name: 'KL Rahul', role: 'BAT', rating: 84 },
      { name: 'Shubman Gill (c)', role: 'BAT', rating: 89 },
      { name: 'Devdutt Padikkal', role: 'BAT', rating: 78 },
      { name: 'Sarfaraz Khan', role: 'BAT', rating: 79 },
      { name: 'Rishabh Pant', role: 'WK', rating: 91 },
      { name: 'Ravindra Jadeja', role: 'ALL', rating: 90 },
      { name: 'Washington Sundar', role: 'ALL', rating: 79 },
      { name: 'Jasprit Bumrah', role: 'BWL', rating: 98 },
      { name: 'Mohammed Siraj', role: 'BWL', rating: 84 },
      { name: 'Akash Deep', role: 'BWL', rating: 78 },
    ],
  },
  Australia: {
    T20: [
      { name: 'Mitchell Marsh (c)', role: 'ALL', rating: 88 },
      { name: 'Travis Head', role: 'BAT', rating: 92 },
      { name: 'Josh Inglis', role: 'WK', rating: 81 },
      { name: 'Glenn Maxwell', role: 'ALL', rating: 87 },
      { name: 'Tim David', role: 'BAT', rating: 85 },
      { name: 'Matthew Short', role: 'BAT', rating: 78 },
      { name: 'Mitchell Owen', role: 'BAT', rating: 77 },
      { name: 'Marcus Stoinis', role: 'ALL', rating: 83 },
      { name: 'Josh Hazlewood', role: 'BWL', rating: 89 },
      { name: 'Adam Zampa', role: 'BWL', rating: 86 },
      { name: 'Nathan Ellis', role: 'BWL', rating: 79 },
    ],
    ODI: [
      { name: 'Pat Cummins (c)', role: 'BWL', rating: 94 },
      { name: 'Travis Head', role: 'BAT', rating: 91 },
      { name: 'David Warner', role: 'BAT', rating: 89 },
      { name: 'Steve Smith', role: 'BAT', rating: 95 },
      { name: 'Marnus Labuschagne', role: 'BAT', rating: 89 },
      { name: 'Josh Inglis', role: 'WK', rating: 82 },
      { name: 'Glenn Maxwell', role: 'ALL', rating: 88 },
      { name: 'Mitchell Starc', role: 'BWL', rating: 91 },
      { name: 'Josh Hazlewood', role: 'BWL', rating: 89 },
      { name: 'Adam Zampa', role: 'BWL', rating: 86 },
      { name: 'Marcus Stoinis', role: 'ALL', rating: 82 },
    ],
    TEST: [
      { name: 'Usman Khawaja', role: 'BAT', rating: 87 },
      { name: 'Steve Smith', role: 'BAT', rating: 96 },
      { name: 'Marnus Labuschagne', role: 'BAT', rating: 91 },
      { name: 'Travis Head', role: 'BAT', rating: 90 },
      { name: 'Alex Carey', role: 'WK', rating: 81 },
      { name: 'Cameron Green', role: 'ALL', rating: 83 },
      { name: 'Pat Cummins (c)', role: 'BWL', rating: 94 },
      { name: 'Mitchell Starc', role: 'BWL', rating: 92 },
      { name: 'Josh Hazlewood', role: 'BWL', rating: 89 },
      { name: 'Nathan Lyon', role: 'BWL', rating: 87 },
      { name: 'Todd Murphy', role: 'BWL', rating: 77 },
    ],
  },
  England: {
    T20: [
      { name: 'Harry Brook (c)', role: 'BAT', rating: 92 },
      { name: 'Phil Salt', role: 'WK', rating: 86 },
      { name: 'Ben Duckett', role: 'BAT', rating: 84 },
      { name: 'Jos Buttler', role: 'WK', rating: 84 },
      { name: 'Jacob Bethell', role: 'ALL', rating: 82 },
      { name: 'Will Jacks', role: 'ALL', rating: 81 },
      { name: 'Sam Curran', role: 'ALL', rating: 83 },
      { name: 'Adil Rashid', role: 'BWL', rating: 85 },
      { name: 'Jofra Archer', role: 'BWL', rating: 90 },
      { name: 'Rehan Ahmed', role: 'BWL', rating: 79 },
      { name: 'Mark Wood', role: 'BWL', rating: 88 },
    ],
    ODI: [
      { name: 'Jos Buttler (c)', role: 'WK', rating: 88 },
      { name: 'Zak Crawley', role: 'BAT', rating: 82 },
      { name: 'Ben Duckett', role: 'BAT', rating: 84 },
      { name: 'Joe Root', role: 'BAT', rating: 96 },
      { name: 'Harry Brook', role: 'BAT', rating: 91 },
      { name: 'Ben Stokes', role: 'ALL', rating: 92 },
      { name: 'Liam Livingstone', role: 'ALL', rating: 83 },
      { name: 'Sam Curran', role: 'ALL', rating: 83 },
      { name: 'Adil Rashid', role: 'BWL', rating: 85 },
      { name: 'Jofra Archer', role: 'BWL', rating: 90 },
      { name: 'Mark Wood', role: 'BWL', rating: 87 },
    ],
    TEST: [
      { name: 'Zak Crawley', role: 'BAT', rating: 82 },
      { name: 'Ben Duckett', role: 'BAT', rating: 84 },
      { name: 'Ollie Pope', role: 'BAT', rating: 85 },
      { name: 'Joe Root', role: 'BAT', rating: 97 },
      { name: 'Harry Brook', role: 'BAT', rating: 92 },
      { name: 'Ben Stokes (c)', role: 'ALL', rating: 93 },
      { name: 'Jonny Bairstow', role: 'WK', rating: 85 },
      { name: 'Chris Woakes', role: 'ALL', rating: 84 },
      { name: 'Stuart Broad', role: 'BWL', rating: 86 },
      { name: 'James Anderson', role: 'BWL', rating: 88 },
      { name: 'Mark Wood', role: 'BWL', rating: 87 },
    ],
  },
  Pakistan: {
    T20: [
      { name: 'Salman Ali Agha (c)', role: 'ALL', rating: 83 },
      { name: 'Babar Azam', role: 'BAT', rating: 94 },
      { name: 'Sahibzada Farhan', role: 'WK', rating: 78 },
      { name: 'Fakhar Zaman', role: 'BAT', rating: 85 },
      { name: 'Saim Ayub', role: 'BAT', rating: 82 },
      { name: 'Usman Khan', role: 'WK', rating: 77 },
      { name: 'Shadab Khan', role: 'ALL', rating: 84 },
      { name: 'Mohammad Nawaz', role: 'ALL', rating: 80 },
      { name: 'Shaheen Shah Afridi', role: 'BWL', rating: 93 },
      { name: 'Naseem Shah', role: 'BWL', rating: 88 },
      { name: 'Abrar Ahmed', role: 'BWL', rating: 80 },
    ],
    ODI: [
      { name: 'Babar Azam (c)', role: 'BAT', rating: 95 },
      { name: 'Mohammad Rizwan', role: 'WK', rating: 91 },
      { name: 'Fakhar Zaman', role: 'BAT', rating: 85 },
      { name: 'Imam-ul-Haq', role: 'BAT', rating: 80 },
      { name: 'Saud Shakeel', role: 'BAT', rating: 82 },
      { name: 'Shadab Khan', role: 'ALL', rating: 84 },
      { name: 'Salman Ali Agha', role: 'ALL', rating: 82 },
      { name: 'Shaheen Shah Afridi', role: 'BWL', rating: 93 },
      { name: 'Naseem Shah', role: 'BWL', rating: 88 },
      { name: 'Haris Rauf', role: 'BWL', rating: 86 },
      { name: 'Mohammad Wasim Jr', role: 'BWL', rating: 80 },
    ],
    TEST: [
      { name: 'Shan Masood (c)', role: 'BAT', rating: 82 },
      { name: 'Imam-ul-Haq', role: 'BAT', rating: 80 },
      { name: 'Babar Azam', role: 'BAT', rating: 93 },
      { name: 'Saud Shakeel', role: 'BAT', rating: 84 },
      { name: 'Mohammad Rizwan', role: 'WK', rating: 89 },
      { name: 'Salman Ali Agha', role: 'ALL', rating: 81 },
      { name: 'Aamer Jamal', role: 'ALL', rating: 79 },
      { name: 'Shaheen Shah Afridi', role: 'BWL', rating: 92 },
      { name: 'Naseem Shah', role: 'BWL', rating: 88 },
      { name: 'Haris Rauf', role: 'BWL', rating: 84 },
      { name: 'Sajid Khan', role: 'BWL', rating: 80 },
    ],
  },
  'South Africa': {
    T20: [
      { name: 'Aiden Markram (c)', role: 'BAT', rating: 88 },
      { name: 'Ryan Rickelton', role: 'BAT', rating: 80 },
      { name: 'Quinton de Kock', role: 'WK', rating: 91 },
      { name: 'Tristan Stubbs', role: 'BAT', rating: 82 },
      { name: 'David Miller', role: 'BAT', rating: 87 },
      { name: 'Dewald Brevis', role: 'BAT', rating: 83 },
      { name: 'Marco Jansen', role: 'ALL', rating: 83 },
      { name: 'Keshav Maharaj', role: 'BWL', rating: 84 },
      { name: 'Kagiso Rabada', role: 'BWL', rating: 94 },
      { name: 'Anrich Nortje', role: 'BWL', rating: 90 },
      { name: 'Kwena Maphaka', role: 'BWL', rating: 79 },
    ],
    ODI: [
      { name: 'Temba Bavuma (c)', role: 'BAT', rating: 85 },
      { name: 'Quinton de Kock', role: 'WK', rating: 92 },
      { name: 'Aiden Markram', role: 'BAT', rating: 87 },
      { name: 'Rassie van der Dussen', role: 'BAT', rating: 86 },
      { name: 'David Miller', role: 'BAT', rating: 88 },
      { name: 'Tristan Stubbs', role: 'BAT', rating: 81 },
      { name: 'Marco Jansen', role: 'ALL', rating: 82 },
      { name: 'Keshav Maharaj', role: 'BWL', rating: 84 },
      { name: 'Kagiso Rabada', role: 'BWL', rating: 94 },
      { name: 'Anrich Nortje', role: 'BWL', rating: 90 },
      { name: 'Tabraiz Shamsi', role: 'BWL', rating: 84 },
    ],
    TEST: [
      { name: 'Neil Brand (c)', role: 'BAT', rating: 80 },
      { name: 'Aiden Markram', role: 'BAT', rating: 86 },
      { name: 'Rassie van der Dussen', role: 'BAT', rating: 84 },
      { name: 'Ryan Rickelton', role: 'BAT', rating: 79 },
      { name: 'Kyle Verreynne', role: 'WK', rating: 80 },
      { name: 'Tristan Stubbs', role: 'BAT', rating: 80 },
      { name: 'Marco Jansen', role: 'ALL', rating: 82 },
      { name: 'Keshav Maharaj', role: 'BWL', rating: 85 },
      { name: 'Kagiso Rabada', role: 'BWL', rating: 95 },
      { name: 'Anrich Nortje', role: 'BWL', rating: 90 },
      { name: 'Lungi Ngidi', role: 'BWL', rating: 83 },
    ],
  },
  'New Zealand': {
    T20: [
      { name: 'Mitchell Santner (c)', role: 'ALL', rating: 84 },
      { name: 'Finn Allen', role: 'BAT', rating: 83 },
      { name: 'Devon Conway', role: 'WK', rating: 87 },
      { name: 'Rachin Ravindra', role: 'ALL', rating: 85 },
      { name: 'Daryl Mitchell', role: 'ALL', rating: 85 },
      { name: 'Glenn Phillips', role: 'ALL', rating: 84 },
      { name: 'Mark Chapman', role: 'BAT', rating: 79 },
      { name: 'Michael Bracewell', role: 'ALL', rating: 80 },
      { name: 'Lockie Ferguson', role: 'BWL', rating: 87 },
      { name: 'Ish Sodhi', role: 'BWL', rating: 82 },
      { name: 'Matt Henry', role: 'BWL', rating: 84 },
    ],
    ODI: [
      { name: 'Kane Williamson (c)', role: 'BAT', rating: 95 },
      { name: 'Devon Conway', role: 'WK', rating: 87 },
      { name: 'Finn Allen', role: 'BAT', rating: 82 },
      { name: 'Daryl Mitchell', role: 'ALL', rating: 85 },
      { name: 'Glenn Phillips', role: 'ALL', rating: 84 },
      { name: 'Tom Latham', role: 'WK', rating: 82 },
      { name: 'Mitchell Santner', role: 'ALL', rating: 83 },
      { name: 'Trent Boult', role: 'BWL', rating: 90 },
      { name: 'Tim Southee', role: 'BWL', rating: 85 },
      { name: 'Lockie Ferguson', role: 'BWL', rating: 86 },
      { name: 'Ish Sodhi', role: 'BWL', rating: 82 },
    ],
    TEST: [
      { name: 'Kane Williamson (c)', role: 'BAT', rating: 95 },
      { name: 'Tom Latham', role: 'WK', rating: 85 },
      { name: 'Devon Conway', role: 'BAT', rating: 84 },
      { name: 'Daryl Mitchell', role: 'ALL', rating: 85 },
      { name: 'Rachin Ravindra', role: 'ALL', rating: 83 },
      { name: 'Henry Nicholls', role: 'BAT', rating: 79 },
      { name: 'Mitchell Santner', role: 'ALL', rating: 83 },
      { name: 'Kyle Jamieson', role: 'ALL', rating: 82 },
      { name: 'Tim Southee', role: 'BWL', rating: 86 },
      { name: 'Matt Henry', role: 'BWL', rating: 84 },
      { name: 'Ish Sodhi', role: 'BWL', rating: 81 },
    ],
  },
};

// Helper: pick the right XI for a team based on match format
function getSquad(teamName: string, format: string): Player[] {
  const teamSquads = TEAM_SQUADS[teamName];
  if (!teamSquads) return [];
  // Normalise: "T20" format string maps to "T20" key, "ODI" -> "ODI", "TEST" -> "TEST"
  return teamSquads[format] ?? teamSquads['T20'] ?? [];
}

const ROLE_STYLES: Record<string, string> = {
  BAT: 'bg-blue-950/40 text-blue-400 border-blue-500/20',
  BWL: 'bg-red-950/40 text-red-400 border-red-500/20',
  ALL: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20',
  WK: 'bg-amber-950/40 text-amber-400 border-amber-500/20',
};

export default function Dashboard() {
  const { 
    upcomingMatches, 
    selectedMatchId, 
    setSelectedMatch, 
    setUpcomingMatches 
  } = useMatchStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scheduled cricket fixtures and predictions
  useEffect(() => {
    async function loadFixtures() {
      try {
        setLoading(true);
        const data = await fetchJson<{ success: boolean; matches: Match[] }>('/api/fixtures');
        if (data.success && data.matches.length > 0) {
          setUpcomingMatches(data.matches);
          // Auto-select the first fixture
          setSelectedMatch(data.matches[0].id);
        } else {
          setError('No fixtures found. Check database seeding.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to sync fixtures');
      } finally {
        setLoading(false);
      }
    }
    loadFixtures();
  }, [setUpcomingMatches, setSelectedMatch]);

  const selectedMatch = upcomingMatches.find((m: Match) => m.id === selectedMatchId) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="w-16 h-16 border-4 border-transparent border-b-purple-500 rounded-full animate-spin absolute inset-0 rotate-45 duration-1000" />
        </div>
        <p className="font-mono text-sm animate-pulse tracking-widest text-slate-400">CONNECTING TO ANALYTICS ENGINE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-slate-300 gap-4 px-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 mb-2">
          <ShieldAlert size={40} className="animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-white">Database Synchronization Offline</h2>
        <p className="max-w-md text-sm text-slate-400 font-light leading-relaxed">
          {error}. Please check that your PostgreSQL server is active, the `DATABASE_URL` is set inside your `.env`, and you have run your initial migrations.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-slate-900 border border-white/10 text-sm font-semibold rounded-lg text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col select-none">
      {/* Sleek cybernetic dashboard header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              CricPredict AI <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-950/30 text-blue-400 font-semibold tracking-wider">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">SYSTEM: DETERMINISTIC REGRESSION CORE ONLINE</p>
          </div>
        </div>

        {/* Playing XI badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-xl">
          <Users size={13} className="text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-slate-300 tracking-wider">PROBABLE PLAYING XI</span>
        </div>
      </header>

      {/* Main split viewport layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-h-[calc(100vh-69px)] bg-black">
        
        {/* PANEL 1: Left-hand scrolling schedule list */}
        <aside className="w-full lg:w-80 xl:w-96 border-r border-white/5 bg-slate-950/20 backdrop-blur-md overflow-y-auto p-4 flex flex-col gap-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]">
          <div>
            <h2 className="text-xs uppercase font-mono tracking-widest text-slate-200 mb-2 px-1">Upcoming Fixtures</h2>
            <p className="text-[10px] text-slate-400 mb-4 px-1 font-mono">SELECT A MATCH TO VIEW PROBABLE XI</p>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {upcomingMatches.map((match: Match) => {
              const isSelected = match.id === selectedMatchId;
              const scheduledDate = new Date(match.scheduledAt);
              
              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match.id)}
                  className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 ${
                    isSelected 
                      ? 'border-blue-500/40 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.08)]' 
                      : 'border-white/5 bg-slate-950/40 hover:border-white/15 hover:bg-slate-950/60'
                  }`}
                >
                  {/* Left accent line for selected match */}
                  {isSelected && (
                    <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-blue-500 to-purple-500" />
                  )}

                  {/* Top info row */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} className="text-slate-400" />
                      {scheduledDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] border ${
                      match.format === 'TEST' 
                        ? 'border-orange-500/20 bg-orange-950/20 text-orange-400' 
                        : match.format === 'ODI' 
                        ? 'border-blue-500/20 bg-blue-950/20 text-blue-400' 
                        : 'border-purple-500/20 bg-purple-950/20 text-purple-400'
                    }`}>
                      {match.format}
                    </span>
                  </div>

                  {/* Competing Teams names */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      {match.homeTeam.logoUrl && (
                        <div className="w-6 h-6 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img 
                            src={match.homeTeam.logoUrl} 
                            alt={`${match.homeTeam.name} Board Logo`} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      )}
                      <span className="font-semibold text-slate-300 group-hover:text-white transition-colors text-sm">{match.homeTeam.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider select-none">VS</span>
                    <div className="flex items-center gap-2 text-right justify-end">
                      <span className="font-semibold text-slate-300 group-hover:text-white transition-colors text-sm">{match.awayTeam.name}</span>
                      {match.awayTeam.logoUrl && (
                        <div className="w-6 h-6 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img 
                            src={match.awayTeam.logoUrl} 
                            alt={`${match.awayTeam.name} Board Logo`} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Venue location */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin size={10} className="text-slate-400" />
                      {match.venue.city}, {match.venue.country}
                    </span>
                    {match.prediction && (
                      <span className="text-[9px] font-semibold text-orange-400 flex items-center gap-0.5 bg-orange-950/20 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono shadow-[0_0_8px_rgba(249,115,22,0.05)]">
                        <Award size={9} />
                        AI: {match.prediction.homeWinConfidence >= match.prediction.awayWinConfidence ? match.homeTeam.shortName : match.awayTeam.shortName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* PANEL 2 & 3: Expansive layout containing 3D canvas and prediction breakdown */}
        <main className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-black">
          
          {/* Main 3D Canvas section */}
          <section className="flex-1 p-4 lg:p-6 flex flex-col gap-4 overflow-hidden relative">
            
            {/* Top overview panel above Canvas */}
            {selectedMatch && (
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
                <div className="flex flex-col gap-1.5 md:items-start text-center md:text-left w-full md:w-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono justify-center md:justify-start">
                    <span>{selectedMatch.venue.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-300" /> {selectedMatch.venue.city}, {selectedMatch.venue.country}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-3 justify-center md:justify-start mt-1">
                    {selectedMatch.homeTeam.logoUrl && (
                      <div className="w-8 h-8 rounded-full bg-white border border-white/10 flex items-center justify-center p-1 shadow-sm overflow-hidden flex-shrink-0">
                        <img 
                          src={selectedMatch.homeTeam.logoUrl} 
                          alt={`${selectedMatch.homeTeam.name} Board Logo`} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    )}
                    <span>{selectedMatch.homeTeam.name}</span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-900 border border-white/10 px-2 py-0.5 rounded-md font-mono select-none">VS</span>
                    {selectedMatch.awayTeam.logoUrl && (
                      <div className="w-8 h-8 rounded-full bg-white border border-white/10 flex items-center justify-center p-1 shadow-sm overflow-hidden flex-shrink-0">
                        <img 
                          src={selectedMatch.awayTeam.logoUrl} 
                          alt={`${selectedMatch.awayTeam.name} Board Logo`} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    )}
                    <span>{selectedMatch.awayTeam.name}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-mono text-slate-300">Live Forecast:</span>
                  <div className="inline-flex rounded-xl bg-slate-900 border border-white/10 p-1.5 text-xs font-mono font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] select-none">
                    <span className="text-blue-400 px-2.5">{selectedMatch.homeTeam.shortName} {Math.round((selectedMatch.prediction?.homeWinConfidence ?? 0.5) * 100)}%</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-purple-400 px-2.5">{selectedMatch.awayTeam.shortName} {Math.round((selectedMatch.prediction?.awayWinConfidence ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Probable Playing XI Panel */}
            <div className="flex-1 min-h-[350px] overflow-y-auto">
              {selectedMatch ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {/* Home Team XI */}
                  <div className="bg-slate-950/60 border border-blue-500/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedMatch.homeTeam.logoUrl && (
                        <div className="w-7 h-7 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img src={selectedMatch.homeTeam.logoUrl} alt={selectedMatch.homeTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedMatch.homeTeam.name}</h3>
                        <p className="text-[9px] font-mono text-blue-400 tracking-widest uppercase">Home · Probable XI</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {getSquad(selectedMatch.homeTeam.name, selectedMatch.format).map((player, i) => (
                        <div key={player.name} className="flex items-center gap-2 group hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">{i + 1}</span>
                          <span className="flex-1 text-sm text-slate-200 font-medium group-hover:text-white transition-colors">{player.name}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${ROLE_STYLES[player.role]}`}>{player.role}</span>
                          <div className="flex items-center gap-0.5">
                            <Star size={9} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-mono text-amber-400">{player.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Team XI */}
                  <div className="bg-slate-950/60 border border-purple-500/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedMatch.awayTeam.logoUrl && (
                        <div className="w-7 h-7 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img src={selectedMatch.awayTeam.logoUrl} alt={selectedMatch.awayTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedMatch.awayTeam.name}</h3>
                        <p className="text-[9px] font-mono text-purple-400 tracking-widest uppercase">Away · Probable XI</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {getSquad(selectedMatch.awayTeam.name, selectedMatch.format).map((player, i) => (
                        <div key={player.name} className="flex items-center gap-2 group hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">{i + 1}</span>
                          <span className="flex-1 text-sm text-slate-200 font-medium group-hover:text-white transition-colors">{player.name}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${ROLE_STYLES[player.role]}`}>{player.role}</span>
                          <div className="flex items-center gap-0.5">
                            <Star size={9} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-mono text-amber-400">{player.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">
                  <Users size={32} className="mr-3 opacity-30" /> Select a match to view squads
                </div>
              )}
            </div>
          </section>

          {/* PANEL 3: Right-hand analytical prediction details overlay */}
          {selectedMatch && selectedMatch.prediction && (
            <aside className="w-full xl:w-96 border-t xl:border-t-0 xl:border-l border-white/5 bg-slate-950/20 backdrop-blur-md overflow-y-auto p-4 lg:p-6 flex flex-col gap-6 max-h-[50vh] xl:max-h-full shadow-[inset_1px_0_0_rgba(255,255,255,0.02)]">
              
              <div>
                <h2 className="text-xs uppercase font-mono tracking-widest text-slate-200 mb-2">Predictive Confidence</h2>
                <p className="text-[10px] text-slate-400 font-mono">DETERMINED VIA ACTIVE FEATURE REGRESSION ENGINE</p>
              </div>

              {/* Confidence ring visualizer card */}
              <div className="relative bg-slate-950/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-[0_4px_30px_rgba(0,0,0,0.3)] overflow-hidden backdrop-blur-sm">
                
                {/* Decorative glowing backdrops */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

                {/* Big confidence scores percentages */}
                <div className="flex w-full items-center justify-around gap-4 mb-4 relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      {selectedMatch.homeTeam.logoUrl && (
                        <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img 
                            src={selectedMatch.homeTeam.logoUrl} 
                            alt={`${selectedMatch.homeTeam.name} Board Logo`} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-300">{selectedMatch.homeTeam.shortName}</span>
                    </div>
                    <span className="text-4xl sm:text-5xl font-extrabold text-blue-500 select-none tracking-tighter filter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                      {Math.round(selectedMatch.prediction.homeWinConfidence * 100)}<span className="text-lg font-light text-blue-400">%</span>
                    </span>
                  </div>
                  
                  {/* Glowing comparison icon */}
                  <div className="h-10 w-10 rounded-full border border-white/5 bg-slate-900 flex items-center justify-center text-slate-400 shadow-sm flex-shrink-0">
                    <ArrowRightLeft size={16} className="text-slate-400 animate-pulse" />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-300">{selectedMatch.awayTeam.shortName}</span>
                      {selectedMatch.awayTeam.logoUrl && (
                        <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
                          <img 
                            src={selectedMatch.awayTeam.logoUrl} 
                            alt={`${selectedMatch.awayTeam.name} Board Logo`} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-4xl sm:text-5xl font-extrabold text-purple-500 select-none tracking-tighter filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      {Math.round(selectedMatch.prediction.awayWinConfidence * 100)}<span className="text-lg font-light text-purple-400">%</span>
                    </span>
                  </div>
                </div>

                {/* Visualizer Win Confidence Slider */}
                <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden flex mb-2 border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all duration-500" 
                    style={{ width: `${selectedMatch.prediction.homeWinConfidence * 100}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-all duration-500" 
                    style={{ width: `${selectedMatch.prediction.awayWinConfidence * 100}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-300 font-mono mt-2">
                  PREDICTED WINNER:{' '}
                  <span className="text-white font-extrabold underline decoration-purple-500 decoration-2 underline-offset-4">
                    {selectedMatch.prediction.homeWinConfidence >= selectedMatch.prediction.awayWinConfidence ? selectedMatch.homeTeam.name : selectedMatch.awayTeam.name}
                  </span>
                </div>
              </div>

              {/* Statistical analytical breakdown factors bars list */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-200 mb-2 px-1">Regression Breakdown</h3>
                  <p className="text-[9px] text-slate-400 px-1 font-mono">PRECISE SCORING FACTOR COMPARISON (0.0 to 1.0)</p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Factor 1: Team Form (Weight 40%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-slate-950/40 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-blue-400" />
                        Recent Team Form
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Weight: 40%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-purple-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 2: Head-To-Head history (Weight 30%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-slate-950/40 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Award size={13} className="text-purple-400" />
                        Head-to-Head Ratio
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Weight: 30%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.h2hHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.h2hHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.h2hAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-purple-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.h2hAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 3: Venue Advantage (Weight 20%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-slate-950/40 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin size={13} className="text-orange-400" />
                        Stadium Venue Index
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Weight: 20%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.venueHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.venueHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.venueAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-purple-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.venueAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 4: Format Weighting (Weight 10%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-slate-950/40 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Tv size={13} className="text-yellow-400" />
                        Format Dynamic Rating
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Weight: 10%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formatHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formatHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formatAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-purple-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formatAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
