'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="group relative flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 text-sm font-semibold text-white transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            Launch Live Predictions
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

          <Link
            href="/history"
            className="group relative flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-8 text-sm font-semibold text-white transition-all duration-300 hover:from-fuchsia-700 hover:to-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            Prediction History
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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

      {/* 5. Footer */}
      <footer className="relative z-20 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md py-6 text-center text-[10px] text-slate-500 font-mono tracking-wider">
        &copy; {new Date().getFullYear()} CRICPREDICT SYSTEM CLUSTER. ALL RIGHTS RESERVED.
      </footer>

    </div>
  );
}
