'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Award, 
  MapPin, 
  ArrowRight, 
  Activity,
  Cpu
} from 'lucide-react';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = containerRef.current?.querySelector('video');
    if (video) {
      // 1. Force absolute muted properties to satisfy all strict mobile and desktop browsers
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.loop = true;
      video.playsInline = true;

      // 2. Ultimate Play trigger function
      const forcePlayVideo = () => {
        if (video && video.paused) {
          video.muted = true;
          video.volume = 0;
          video.play()
            .then(() => {
              console.log("✓ Autoplay forced successfully.");
              cleanupListeners();
            })
            .catch(err => {
              console.log("Autoplay attempt prevented: ", err.message);
            });
        }
      };

      // 3. Register global user gesture listeners on window and document levels
      const interactionEvents = ['click', 'touchstart', 'mousemove', 'keydown', 'scroll', 'mousedown'];
      const cleanupListeners = () => {
        interactionEvents.forEach(event => {
          window.removeEventListener(event, forcePlayVideo);
          document.removeEventListener(event, forcePlayVideo);
        });
      };

      interactionEvents.forEach(event => {
        window.addEventListener(event, forcePlayVideo, { passive: true });
        document.addEventListener(event, forcePlayVideo, { passive: true });
      });

      // 4. Initial attempt
      forcePlayVideo();

      // 5. Active Polling fallback: Try to play every 250ms for 3 seconds in case of slow page loading/buffer
      let pollCount = 0;
      const playInterval = setInterval(() => {
        if (video) {
          if (!video.paused) {
            clearInterval(playInterval);
            cleanupListeners();
          } else {
            forcePlayVideo();
          }
        }
        pollCount++;
        if (pollCount > 12) { // 3 seconds total
          clearInterval(playInterval);
        }
      }, 250);

      // Clean up on unmount
      return () => {
        clearInterval(playInterval);
        cleanupListeners();
      };
    }
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Full-screen Video Background */}
      <div ref={containerRef} className="absolute inset-0 bg-black z-0">
        <div 
          className="absolute inset-0 z-0"
          dangerouslySetInnerHTML={{
            __html: `
              <video
                autoplay
                loop
                muted
                playsinline
                webkit-playsinline
                src="/background-video.mp4"
                class="absolute inset-0 w-full h-full object-cover animate-video-fade-in pointer-events-none z-0"
              ></video>
            `
          }}
        />
        
        {/* Subtle cyber grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        
        {/* Radial vignette overlay to darken corners and focus center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_20%,rgba(0,0,0,0.8)_90%)] pointer-events-none" />
        
        {/* Iridescent background neon glows matching the video reflection palette */}
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute top-1/2 right-10 w-[20rem] h-[20rem] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* 2. Top Header Navigation */}
      <header className="relative z-20 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Cpu size={16} className="text-white animate-spin duration-[10s]" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-widest bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              CRICPREDICT <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI</span>
            </span>
            <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">REGRESSION CALCULATOR</p>
          </div>
        </div>

        {/* Dynamic status pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-950/20 px-3.5 py-1 text-[9px] font-mono font-bold text-orange-400 uppercase tracking-widest shadow-[0_0_10px_rgba(249,115,22,0.1)]">
          <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
          PREDICTIVE SYSTEM ONLINE
        </div>
      </header>

      {/* 3. Hero / Main Content Layer */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-16 text-center select-none">
        
        {/* Dynamic Glowing Headline */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-12 leading-tight select-none">
          Predict the Future of Cricket with{' '}
          <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(168,85,247,0.35)] animate-pulse">
            Holographic AI
          </span>
        </h1>

        {/* Actions - Stylish Neon-accented Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
          <Link
            href="/dashboard"
            className="group relative flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 p-[1.5px] shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)] transition-all duration-300"
          >
            <span className="flex h-full w-full items-center justify-center rounded-[11px] bg-black px-8 text-sm font-extrabold text-white transition-colors duration-300 group-hover:bg-slate-950/20">
              Launch Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5 text-blue-400" />
            </span>
          </Link>
          
          <a
            href="https://me-aryan.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 px-8 text-sm font-bold text-slate-300 hover:text-white transition-all duration-300 backdrop-blur-md shadow-sm"
          >
            About Me
          </a>
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="relative z-20 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md py-6 text-center text-[10px] text-slate-500 font-mono tracking-wider">
        &copy; {new Date().getFullYear()} CRICPREDICT SYSTEM CLUSTER. ALL RIGHTS RESERVED.
      </footer>

    </div>
  );
}
