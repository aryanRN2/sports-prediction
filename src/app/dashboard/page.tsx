'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMatchStore, Match } from '@/store/useMatchStore';
import { fetchJson } from '@/lib/api-client';
import { 
  Calendar, 
  MapPin, 
  Percent, 
  TrendingUp, 
  Award, 
  Tv, 
  ShieldAlert, 
  Globe, 
  Compass,
  ArrowRightLeft
} from 'lucide-react';

// Dynamically import CanvasWrapper with SSR disabled to prevent WebGL compilation errors on server build
const CanvasWrapper = dynamic(() => import('@/components/dashboard/CanvasWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 font-mono text-sm">
      <span className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      Loading 3D Canvas Engine...
    </div>
  )
});

export default function Dashboard() {
  const { 
    upcomingMatches, 
    selectedMatchId, 
    setSelectedMatch, 
    setUpcomingMatches 
  } = useMatchStore();

  const [viewMode, setViewMode] = useState<'stadium' | 'globe'>('stadium');
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

  const selectedMatch = upcomingMatches.find(m => m.id === selectedMatchId) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin absolute inset-0 rotate-45 duration-1000" />
        </div>
        <p className="font-mono text-sm animate-pulse tracking-widest text-slate-400">CONNECTING TO ANALYTICS ENGINE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4 px-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 mb-2">
          <ShieldAlert size={40} className="animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-white">Database Synchronization Offline</h2>
        <p className="max-w-md text-sm text-slate-400 font-light leading-relaxed">
          {error}. Please check that your PostgreSQL server is active, the `DATABASE_URL` is set inside your `.env`, and you have run your initial migrations.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-slate-900 border border-slate-800 text-sm font-semibold rounded-lg text-white hover:bg-slate-800 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Sleek cybernetic dashboard header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            CP
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              CricPredict AI <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 font-semibold tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.05)]">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">SYSTEM: DETERMINISTIC REGRESSION MATRIX ONLINE</p>
          </div>
        </div>

        {/* Scene toggler controls */}
        <div className="flex gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-xl backdrop-blur-sm shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setViewMode('stadium')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'stadium' 
                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={14} />
            Stadium Arena
          </button>
          <button
            onClick={() => setViewMode('globe')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'globe' 
                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} />
            Global View
          </button>
        </div>
      </header>

      {/* Main split viewport layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-h-[calc(100vh-69px)]">
        
        {/* PANEL 1: Left-hand scrolling schedule list */}
        <aside className="w-full lg:w-80 xl:w-96 border-r border-slate-900 bg-slate-950/40 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <h2 className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-2 px-1">Upcoming Fixtures</h2>
            <p className="text-[10px] text-slate-600 mb-4 px-1 font-mono">CLICK TO RENDER DYNAMIC 3D SCENE & OUTCOME</p>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {upcomingMatches.map((match) => {
              const isSelected = match.id === selectedMatchId;
              const scheduledDate = new Date(match.scheduledAt);
              
              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match.id)}
                  className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 ${
                    isSelected 
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.05)]' 
                      : 'border-slate-900 bg-slate-900/10 hover:border-slate-800 hover:bg-slate-900/30'
                  }`}
                >
                  {/* Left accent line for selected match */}
                  {isSelected && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500" />
                  )}

                  {/* Top info row */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {scheduledDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] border ${
                      match.format === 'TEST' 
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' 
                        : match.format === 'ODI' 
                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-500' 
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {match.format}
                    </span>
                  </div>

                  {/* Competing Teams names */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{match.homeTeam.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 font-mono tracking-wider">VS</span>
                    <div className="flex items-center gap-2.5 text-right justify-end">
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Venue location */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin size={10} className="text-slate-500" />
                      {match.venue.city}, {match.venue.country}
                    </span>
                    {match.prediction && (
                      <span className="text-[9px] font-semibold text-emerald-400 flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded font-mono">
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
        <main className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-slate-950">
          
          {/* Main 3D Canvas section */}
          <section className="flex-1 p-4 lg:p-6 flex flex-col gap-4 overflow-hidden relative">
            
            {/* Top overview panel above Canvas */}
            {selectedMatch && (
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-md">
                <div className="flex flex-col gap-1.5 md:items-start text-center md:text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{selectedMatch.venue.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {selectedMatch.venue.city}, {selectedMatch.venue.country}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 justify-center md:justify-start">
                    {selectedMatch.homeTeam.name}
                    <span className="text-xs text-slate-600 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md font-mono">VS</span>
                    {selectedMatch.awayTeam.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Live Forecast:</span>
                  <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800/80 p-1.5 text-xs font-mono font-bold shadow-md select-none">
                    <span className="text-blue-400 px-2.5">{selectedMatch.homeTeam.shortName} {(selectedMatch.prediction?.homeWinConfidence ?? 0.5) * 100}%</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-emerald-400 px-2.5">{selectedMatch.awayTeam.shortName} {(selectedMatch.prediction?.awayWinConfidence ?? 0.5) * 100}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* The 3D Canvas dynamic mount */}
            <div className="flex-1 min-h-[350px] relative">
              <CanvasWrapper viewMode={viewMode} />
            </div>
          </section>

          {/* PANEL 3: Right-hand analytical prediction details overlay */}
          {selectedMatch && selectedMatch.prediction && (
            <aside className="w-full xl:w-96 border-t xl:border-t-0 xl:border-l border-slate-900 bg-slate-950 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6 max-h-[50vh] xl:max-h-full">
              
              <div>
                <h2 className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-2">Predictive Confidence</h2>
                <p className="text-[10px] text-slate-600 font-mono">DETERMINED VIA ACTIVE FEATURE REGRESSION CALCULATOR</p>
              </div>

              {/* Confidence ring visualizer card */}
              <div className="relative bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-hidden backdrop-blur-md">
                
                {/* Decorative glowing backdrops */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                {/* Big confidence scores percentages */}
                <div className="flex w-full items-center justify-around gap-4 mb-4 relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-bold text-slate-500 mb-1">{selectedMatch.homeTeam.shortName}</span>
                    <span className="text-4xl sm:text-5xl font-extrabold text-blue-400 select-none tracking-tighter">
                      {Math.round(selectedMatch.prediction.homeWinConfidence * 100)}<span className="text-lg font-light text-blue-500/70">%</span>
                    </span>
                  </div>
                  
                  {/* Glowing comparison icon */}
                  <div className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shadow-md">
                    <ArrowRightLeft size={16} className="text-slate-400 animate-pulse" />
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-bold text-slate-500 mb-1">{selectedMatch.awayTeam.shortName}</span>
                    <span className="text-4xl sm:text-5xl font-extrabold text-emerald-400 select-none tracking-tighter">
                      {Math.round(selectedMatch.prediction.awayWinConfidence * 100)}<span className="text-lg font-light text-emerald-500/70">%</span>
                    </span>
                  </div>
                </div>

                {/* Visualizer Win Confidence Slider */}
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex mb-2 border border-slate-900/50">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500" 
                    style={{ width: `${selectedMatch.prediction.homeWinConfidence * 100}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" 
                    style={{ width: `${selectedMatch.prediction.awayWinConfidence * 100}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-400 font-mono mt-2">
                  PREDICTED WINNER:{' '}
                  <span className="text-white font-extrabold underline decoration-blue-500 decoration-2 underline-offset-4">
                    {selectedMatch.prediction.homeWinConfidence >= selectedMatch.prediction.awayWinConfidence ? selectedMatch.homeTeam.name : selectedMatch.awayTeam.name}
                  </span>
                </div>
              </div>

              {/* Statistical analytical breakdown factors bars list */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-500 mb-2 px-1">Regression Breakdown</h3>
                  <p className="text-[9px] text-slate-600 px-1 font-mono">PRECISE SCORING FACTOR COMPARISON matrix (0.0 to 1.0)</p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Factor 1: Team Form (Weight 40%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-blue-400" />
                        Recent Team Form
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Weight: 40%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden flex border border-slate-900">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-emerald-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 2: Head-To-Head history (Weight 30%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Award size={13} className="text-indigo-400" />
                        Head-to-Head Ratio
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Weight: 30%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.h2hHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden flex border border-slate-900">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.h2hHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.h2hAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-emerald-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.h2hAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 3: Venue Advantage (Weight 20%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin size={13} className="text-amber-400" />
                        Stadium Venue Index
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Weight: 20%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.venueHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden flex border border-slate-900">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.venueHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.venueAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-emerald-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.venueAway?.toFixed(2) || '0.50'}</span>
                    </div>
                  </div>

                  {/* Factor 4: Format Weighting (Weight 10%) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Tv size={13} className="text-emerald-400" />
                        Format Dynamic Rating
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Weight: 10%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                      <span className="text-blue-400">{selectedMatch.homeTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formatHome?.toFixed(2) || '0.50'}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden flex border border-slate-900">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formatHome || 0.5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(selectedMatch.prediction.featureSnapshot?.formatAway || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-emerald-400">{selectedMatch.awayTeam.shortName}: {selectedMatch.prediction.featureSnapshot?.formatAway?.toFixed(2) || '0.50'}</span>
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
