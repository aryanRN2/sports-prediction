'use client';

import React, { useEffect, useState } from 'react';
import { useMatchStore, Match } from '@/store/useMatchStore';
import { fetchJson } from '@/lib/api-client';
import Link from 'next/link';
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

import { getSquad, Player } from '@/lib/squads';

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
        if (data.success) {
          setUpcomingMatches(data.matches);
          if (data.matches.length > 0) {
            setSelectedMatch(data.matches[0].id);
          }
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
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <Link href="/" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2 truncate">
              CricPredict AI <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-950/30 text-blue-400 font-semibold tracking-wider shrink-0">v2.0</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase hidden sm:block">SYSTEM: DETERMINISTIC REGRESSION CORE ONLINE</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link 
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 transition-colors shrink-0"
          >
            ← HOME
          </Link>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl shrink-0">
            <Users size={12} className="text-emerald-400" />
            <span className="text-[10px] font-mono font-semibold text-slate-300 tracking-wider hidden sm:inline">PROBABLE PLAYING XI</span>
            <span className="text-[10px] font-mono font-semibold text-slate-300 tracking-wider sm:hidden">PLAYING XI</span>
          </div>
        </div>
      </header>

      {/* Main layout — stacks vertically on mobile, side-by-side on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden lg:max-h-[calc(100vh-61px)] bg-black">

        {/* PANEL 1: Fixtures — horizontal scroll on mobile, vertical sidebar on desktop */}
        <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/20 backdrop-blur-md lg:overflow-y-auto p-3 lg:p-4 flex flex-col gap-3">
          <div className="hidden lg:block">
            <h2 className="text-xs uppercase font-mono tracking-widest text-slate-200 mb-1 px-1">Upcoming Fixtures</h2>
            <p className="text-[10px] text-slate-400 mb-3 px-1 font-mono">SELECT A MATCH TO VIEW PROBABLE XI</p>
          </div>

          {/* Mobile: horizontal scroll carousel */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 snap-x snap-mandatory lg:snap-none">
            {upcomingMatches.map((match: Match) => {
              const isSelected = match.id === selectedMatchId;
              const scheduledDate = new Date(match.scheduledAt);

              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match.id)}
                  className={`group relative overflow-hidden snap-start shrink-0 lg:shrink w-72 lg:w-auto p-3 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'border-blue-500/40 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.08)]'
                      : 'border-white/5 bg-slate-950/40 hover:border-white/15 hover:bg-slate-950/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-blue-500 to-purple-500" />
                  )}

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
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

                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {match.homeTeam.logoUrl && (
                        <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-300 text-xs">{match.homeTeam.shortName}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">VS</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-semibold text-slate-300 text-xs">{match.awayTeam.shortName}</span>
                      {match.awayTeam.logoUrl && (
                        <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={9} />
                      {match.venue.city}
                    </span>
                    {match.prediction && (
                      <span className="text-[9px] font-semibold text-orange-400 flex items-center gap-0.5 bg-orange-950/20 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                        <Award size={9} />
                        {match.prediction.homeWinConfidence >= match.prediction.awayWinConfidence ? match.homeTeam.shortName : match.awayTeam.shortName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* PANEL 2 & 3: Main content + prediction stats */}
        <main className="flex-1 flex flex-col lg:overflow-hidden bg-black">

          {/* Match overview bar */}
          <section className="p-3 lg:p-4 flex flex-col gap-3 lg:overflow-y-auto">

            {/* Match header */}
            {selectedMatch && (
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono flex-wrap">
                    <span>{selectedMatch.venue.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {selectedMatch.venue.city}, {selectedMatch.venue.country}</span>
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2 flex-wrap mt-0.5">
                    {selectedMatch.homeTeam.logoUrl && (
                      <div className="w-7 h-7 rounded-full bg-white border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img src={selectedMatch.homeTeam.logoUrl} alt={selectedMatch.homeTeam.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <span>{selectedMatch.homeTeam.name}</span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-900 border border-white/10 px-2 py-0.5 rounded-md font-mono">VS</span>
                    {selectedMatch.awayTeam.logoUrl && (
                      <div className="w-7 h-7 rounded-full bg-white border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img src={selectedMatch.awayTeam.logoUrl} alt={selectedMatch.awayTeam.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <span>{selectedMatch.awayTeam.name}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Forecast:</span>
                  <div className="inline-flex rounded-lg bg-slate-900 border border-white/10 p-1 text-[11px] font-mono font-bold">
                    <span className="text-blue-400 px-2">{selectedMatch.homeTeam.shortName} {Math.round((selectedMatch.prediction?.homeWinConfidence ?? 0.5) * 100)}%</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-purple-400 px-2">{selectedMatch.awayTeam.shortName} {Math.round((selectedMatch.prediction?.awayWinConfidence ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Playing XI cards — side by side on sm+, stacked on xs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedMatch ? (
                <>
                  {/* Home Team XI */}
                  <div className="bg-slate-950/60 border border-blue-500/10 rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      {selectedMatch.homeTeam.logoUrl && (
                        <div className="w-6 h-6 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img src={selectedMatch.homeTeam.logoUrl} alt={selectedMatch.homeTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{selectedMatch.homeTeam.name}</h3>
                        <p className="text-[9px] font-mono text-blue-400 tracking-widest uppercase">Home · Probable XI</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getSquad(selectedMatch.homeTeam.name, selectedMatch.format).map((player, i) => (
                        <div key={player.name} className="flex items-center gap-2 group active:bg-white/5 hover:bg-white/5 rounded-lg px-1.5 py-1 transition-colors">
                          <span className="text-[10px] font-mono text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
                          <span className="flex-1 text-xs text-slate-200 font-medium min-w-0 truncate">{player.name}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${ROLE_STYLES[player.role]}`}>{player.role}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={8} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-mono text-amber-400">{player.rating}</span>
                          </div>
                        </div>
                      ))}
                      {getSquad(selectedMatch.homeTeam.name, selectedMatch.format).length === 0 && (
                        <div className="text-center py-6 text-slate-500 font-mono text-xs">
                          Squad not available for this team.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Away Team XI */}
                  <div className="bg-slate-950/60 border border-purple-500/10 rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      {selectedMatch.awayTeam.logoUrl && (
                        <div className="w-6 h-6 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img src={selectedMatch.awayTeam.logoUrl} alt={selectedMatch.awayTeam.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{selectedMatch.awayTeam.name}</h3>
                        <p className="text-[9px] font-mono text-purple-400 tracking-widest uppercase">Away · Probable XI</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getSquad(selectedMatch.awayTeam.name, selectedMatch.format).map((player, i) => (
                        <div key={player.name} className="flex items-center gap-2 group active:bg-white/5 hover:bg-white/5 rounded-lg px-1.5 py-1 transition-colors">
                          <span className="text-[10px] font-mono text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
                          <span className="flex-1 text-xs text-slate-200 font-medium min-w-0 truncate">{player.name}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${ROLE_STYLES[player.role]}`}>{player.role}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={8} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-mono text-amber-400">{player.rating}</span>
                          </div>
                        </div>
                      ))}
                      {getSquad(selectedMatch.awayTeam.name, selectedMatch.format).length === 0 && (
                        <div className="text-center py-6 text-slate-500 font-mono text-xs">
                          Squad not available for this team.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex items-center justify-center py-16 text-slate-500 font-mono text-sm">
                  <Users size={28} className="mr-3 opacity-30" /> Select a match to view details
                </div>
              )}
            </div>

            {/* PANEL 3: Prediction Stats — full width below XI on mobile */}
            {selectedMatch && selectedMatch.prediction && (
              <div className="border-t border-white/5 bg-slate-950/20 backdrop-blur-md p-3 lg:p-4 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs uppercase font-mono tracking-widest text-slate-200">Predictive Confidence</h2>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">REGRESSION ENGINE ANALYSIS</p>
                  </div>
                </div>

                {/* Confidence scores */}
                <div className="relative bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center overflow-hidden">
                  <div className="absolute -top-8 -left-8 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

                  <div className="flex w-full items-center justify-around gap-4 mb-4 relative z-10">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        {selectedMatch.homeTeam.logoUrl && (
                          <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                            <img src={selectedMatch.homeTeam.logoUrl} alt={selectedMatch.homeTeam.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="text-xs font-mono font-bold text-slate-300">{selectedMatch.homeTeam.shortName}</span>
                      </div>
                      <span className="text-4xl font-extrabold text-blue-500 tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        {Math.round(selectedMatch.prediction.homeWinConfidence * 100)}<span className="text-base font-light text-blue-400">%</span>
                      </span>
                    </div>

                    <div className="h-9 w-9 rounded-full border border-white/5 bg-slate-900 flex items-center justify-center shrink-0">
                      <ArrowRightLeft size={14} className="text-slate-400 animate-pulse" />
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-300">{selectedMatch.awayTeam.shortName}</span>
                        {selectedMatch.awayTeam.logoUrl && (
                          <div className="w-5 h-5 rounded-full bg-white border border-white/10 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                            <img src={selectedMatch.awayTeam.logoUrl} alt={selectedMatch.awayTeam.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                      <span className="text-4xl font-extrabold text-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(168,85,247,0.35)]">
                        {Math.round(selectedMatch.prediction.awayWinConfidence * 100)}<span className="text-base font-light text-purple-400">%</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex mb-2 border border-white/5">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500" style={{ width: `${selectedMatch.prediction.homeWinConfidence * 100}%` }} />
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500" style={{ width: `${selectedMatch.prediction.awayWinConfidence * 100}%` }} />
                  </div>

                  <div className="text-[10px] text-slate-300 font-mono mt-1">
                    PREDICTED WINNER:{' '}
                    <span className="text-white font-extrabold underline decoration-purple-500 decoration-2 underline-offset-4">
                      {selectedMatch.prediction.predictedWinnerId === selectedMatch.homeTeamId ? selectedMatch.homeTeam.name : selectedMatch.awayTeam.name}
                    </span>
                  </div>
                </div>

                {/* Factor breakdown — 2-col grid on mobile */}
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-200 mb-1">Regression Breakdown</h3>
                  <p className="text-[9px] text-slate-400 font-mono mb-3">FACTOR COMPARISON (0.0–1.0)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Recent Form', weight: '40%', icon: <TrendingUp size={12} className="text-blue-400" />, home: selectedMatch.prediction.featureSnapshot?.formHome, away: selectedMatch.prediction.featureSnapshot?.formAway },
                      { label: 'Head-to-Head', weight: '30%', icon: <Award size={12} className="text-purple-400" />, home: selectedMatch.prediction.featureSnapshot?.h2hHome, away: selectedMatch.prediction.featureSnapshot?.h2hAway },
                      { label: 'Venue Index', weight: '20%', icon: <MapPin size={12} className="text-orange-400" />, home: selectedMatch.prediction.featureSnapshot?.venueHome, away: selectedMatch.prediction.featureSnapshot?.venueAway },
                      { label: 'Format Rating', weight: '10%', icon: <Tv size={12} className="text-yellow-400" />, home: selectedMatch.prediction.featureSnapshot?.formatHome, away: selectedMatch.prediction.featureSnapshot?.formatAway },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-white/5 bg-slate-950/40">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1">{f.icon}{f.label}</span>
                          <span className="text-[10px] font-mono text-slate-500">{f.weight}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-blue-400 w-16 shrink-0">{selectedMatch.homeTeam.shortName}: {(f.home ?? 0.5).toFixed(2)}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                            <div className="h-full bg-blue-500" style={{ width: `${(f.home ?? 0.5) * 100}%` }} />
                            <div className="h-full bg-purple-500" style={{ width: `${(f.away ?? 0.5) * 100}%` }} />
                          </div>
                          <span className="text-purple-400 w-16 text-right shrink-0">{selectedMatch.awayTeam.shortName}: {(f.away ?? 0.5).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
