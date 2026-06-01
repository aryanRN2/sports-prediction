import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-slate-950 overflow-hidden px-6 py-24 text-center">
      {/* Dynamic Grid Background with Glow effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-[25rem] h-[25rem] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      <main className="relative flex flex-col items-center max-w-4xl z-10">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Cricket Prediction Engine
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Unleash the Power of{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent cyber-title">
            Cricket AI
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed font-light">
          Experience match winner predictions like never before. Powered by a deterministic regression weights matrix analyzing Team Form, Head-to-Head records, Venue indices, and match format dynamics, visualised inside a breathtaking 3D WebGL stadium.
        </p>

        {/* Action button with gorgeous hover micro-animations */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/dashboard"
            className="group relative flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 text-sm font-semibold text-white transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            Launch Live Dashboard
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          
          <a
            href="https://github.com/aryanRN2/sports-prediction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-8 text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300 backdrop-blur-md"
          >
            View Repository
          </a>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="absolute bottom-6 text-xs text-slate-600 select-none">
        &copy; {new Date().getFullYear()} CricPredict AI Cluster. All rights reserved.
      </footer>
    </div>
  );
}
