'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import MatchGlobe from '../canvas/MatchGlobe';
import StadiumScene from '../canvas/StadiumScene';
import DataVisualizer from '../canvas/DataVisualizer';

interface CanvasWrapperProps {
  viewMode: 'stadium' | 'globe';
}

export default function CanvasWrapper({ viewMode }: CanvasWrapperProps) {
  return (
    <div className="w-full h-full relative bg-black rounded-2xl border border-white/5 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
      {/* Dynamic scanlines/hologram background effect overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-30" />
      
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-sm z-20">
          <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          Initializing Hologram...
        </div>
      }>
        <Canvas
          camera={{ position: viewMode === 'globe' ? [0, 0, 6] : [0, 3.5, 5], fov: 45 }}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          className="w-full h-full"
        >
          {/* Cybernetic neon lighting */}
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.85} />
          <pointLight position={[10, 10, 10]} intensity={1.0} color="#3b82f6" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a855f7" />

          {viewMode === 'globe' ? (
            <group>
              <MatchGlobe />
            </group>
          ) : (
            <group>
              <StadiumScene />
              <DataVisualizer />
            </group>
          )}

          {/* User interaction controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            maxDistance={viewMode === 'globe' ? 12 : 7}
            minDistance={viewMode === 'globe' ? 4 : 2}
            maxPolarAngle={viewMode === 'globe' ? Math.PI : Math.PI / 2 - 0.05}
          />
          <Preload all />
        </Canvas>
      </Suspense>

      {/* Floating 3D Control Instructions */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-400 bg-black/60 border border-white/5 px-2.5 py-1 rounded select-none backdrop-blur-sm pointer-events-none z-10 uppercase tracking-wider shadow-sm">
        Drag to Rotate / Scroll to Zoom
      </div>
    </div>
  );
}
