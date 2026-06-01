'use client';

import React, { useState } from 'react';
import { useMatchStore, Match } from '@/store/useMatchStore';
import { Html } from '@react-three/drei';

interface VisualizerBarProps {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  value: number;
}

function VisualizerBar({ position, height, color, label, value }: VisualizerBarProps) {
  const [hovered, setHovered] = useState(false);
  const barHeight = Math.max(0.1, height * 1.8); // Scale for beautiful visualization

  return (
    <group position={position}>
      {/* 3D Pillar cylinder */}
      <mesh
        position={[0, barHeight / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.06, 0.06, barHeight, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.25}
          roughness={0.1}
          metalness={0.8}
          transmission={0.5}
          thickness={0.5}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Floating value display on hover */}
      {hovered && (
        <Html position={[0, barHeight + 0.3, 0]} center distanceFactor={6}>
          <div className="bg-white/95 text-slate-800 px-2 py-1 rounded border border-slate-100 text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none">
            <span className="font-semibold">{label}: </span>
            <span>{Math.round(value * 100)}%</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function DataVisualizer() {
  const { upcomingMatches, selectedMatchId } = useMatchStore();
  const selectedMatch = upcomingMatches.find((m: Match) => m.id === selectedMatchId) || null;

  // Features to compare
  const features = selectedMatch?.prediction?.featureSnapshot || {
    formHome: 0.5,
    formAway: 0.5,
    h2hHome: 0.5,
    h2hAway: 0.5,
    venueHome: 0.5,
    venueAway: 0.5,
    formatHome: 0.5,
    formatAway: 0.5,
  };

  const featurePairs = [
    {
      label: 'Team Form',
      homeVal: features.formHome,
      awayVal: features.formAway,
      posHome: [-1.8, 0, -0.4] as [number, number, number],
      posAway: [-1.8, 0, -1.2] as [number, number, number],
    },
    {
      label: 'H2H History',
      homeVal: features.h2hHome,
      awayVal: features.h2hAway,
      posHome: [-0.6, 0, -0.4] as [number, number, number],
      posAway: [-0.6, 0, -1.2] as [number, number, number],
    },
    {
      label: 'Venue Index',
      homeVal: features.venueHome,
      awayVal: features.venueAway,
      posHome: [0.6, 0, -0.4] as [number, number, number],
      posAway: [0.6, 0, -1.2] as [number, number, number],
    },
    {
      label: 'Format Match',
      homeVal: features.formatHome,
      awayVal: features.formatAway,
      posHome: [1.8, 0, -0.4] as [number, number, number],
      posAway: [1.8, 0, -1.2] as [number, number, number],
    },
  ];

  return (
    <group position={[0, -0.2, 0]}>
      {featurePairs.map((pair, idx) => (
        <group key={idx}>
          {/* Label under the columns */}
          <Html position={[(pair.posHome[0] + pair.posAway[0]) / 2, -0.15, (pair.posHome[2] + pair.posAway[2]) / 2]} center distanceFactor={8}>
            <div className="bg-white border border-slate-200 text-slate-500 font-mono font-bold text-[6px] tracking-widest px-2 py-0.5 rounded shadow-[0_1px_3px_rgba(0,0,0,0.02)] uppercase select-none whitespace-nowrap backdrop-blur-sm">
              {pair.label}
            </div>
          </Html>

          {/* Home team metric pillar (Blue) */}
          <VisualizerBar
            position={pair.posHome}
            height={pair.homeVal}
            color="#3b82f6"
            label={`${selectedMatch?.homeTeam.shortName || 'Home'} ${pair.label}`}
            value={pair.homeVal}
          />

          {/* Away team metric pillar (Purple) */}
          <VisualizerBar
            position={pair.posAway}
            height={pair.awayVal}
            color="#a855f7"
            label={`${selectedMatch?.awayTeam.shortName || 'Away'} ${pair.label}`}
            value={pair.awayVal}
          />
        </group>
      ))}
    </group>
  );
}
