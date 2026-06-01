'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMatchStore, Match } from '@/store/useMatchStore';

export default function StadiumScene() {
  const { upcomingMatches, selectedMatchId } = useMatchStore();
  const pitchRingRef = useRef<THREE.Mesh>(null);
  const homeShieldRef = useRef<THREE.Mesh>(null);
  const awayShieldRef = useRef<THREE.Mesh>(null);

  const selectedMatch = upcomingMatches.find((m: Match) => m.id === selectedMatchId) || null;

  // Retrieve prediction metrics or fallback
  const homeConfidence = selectedMatch?.prediction?.homeWinConfidence ?? 0.5;
  const awayConfidence = selectedMatch?.prediction?.awayWinConfidence ?? 0.5;

  // Base configurations
  const BASE_SCALE = 0.18;
  const SCALE_FACTOR = 0.32;

  // Real-time animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Rotate stadium pitch ring slightly
    if (pitchRingRef.current) {
      pitchRingRef.current.rotation.z = time * 0.15;
    }

    // Animate home shield (floating + rotation + dynamic scale)
    if (homeShieldRef.current) {
      homeShieldRef.current.rotation.y = time * 0.8;
      homeShieldRef.current.rotation.x = Math.sin(time * 1.2) * 0.2;
      homeShieldRef.current.position.y = Math.sin(time * 2.0) * 0.1 + 0.8;

      const targetScale = BASE_SCALE + homeConfidence * SCALE_FACTOR;
      homeShieldRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }

    // Animate away shield (floating + rotation + dynamic scale)
    if (awayShieldRef.current) {
      awayShieldRef.current.rotation.y = -time * 0.8;
      awayShieldRef.current.rotation.x = Math.cos(time * 1.2) * 0.2;
      awayShieldRef.current.position.y = Math.cos(time * 2.0) * 0.1 + 0.8;

      const targetScale = BASE_SCALE + awayConfidence * SCALE_FACTOR;
      awayShieldRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* 3D Holographic Stadium Base Grid */}
      <gridHelper args={[10, 20, '#1e293b', '#0f172a']} position={[0, 0, 0]} />

      {/* Stadium Outer Ring Wall */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <torusGeometry args={[3.2, 0.08, 16, 100]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.6} />
      </mesh>

      {/* Stadium Inner Glowing Border */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <torusGeometry args={[2.5, 0.04, 8, 64]} />
        <meshBasicMaterial color="#a855f7" toneMapped={false} />
      </mesh>

      {/* Central digital pitch disc */}
      <mesh ref={pitchRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0, 2.2, 32]} />
        <meshBasicMaterial 
          color="#090d16" 
          transparent 
          opacity={0.9}
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Cyber Pitch Markings Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.2, 1.25, 4]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Team A (Home Team) Shield/Object */}
      <group position={[-1.2, 0.8, 0]}>
        <mesh ref={homeShieldRef}>
          <octahedronGeometry args={[0.6]} />
          <meshPhysicalMaterial 
            color="#3b82f6" 
            emissive="#1d4ed8"
            roughness={0.1}
            metalness={0.9}
            transmission={0.6}
            thickness={0.8}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Under-shield glowing beam */}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.15, 0.01, 0.5, 16, 1, true]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Floating Team B (Away Team) Shield/Object */}
      <group position={[1.2, 0.8, 0]}>
        <mesh ref={awayShieldRef}>
          <dodecahedronGeometry args={[0.5]} />
          <meshPhysicalMaterial 
            color="#a855f7" 
            emissive="#6b21a8"
            roughness={0.1}
            metalness={0.9}
            transmission={0.6}
            thickness={0.8}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Under-shield glowing beam */}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.15, 0.01, 0.5, 16, 1, true]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Stadium Floodlights (Dynamic Pointlights) */}
      <pointLight position={[-4, 4, -4]} intensity={2.0} color="#3b82f6" />
      <pointLight position={[4, 4, 4]} intensity={2.0} color="#a855f7" />
      <directionalLight position={[0, 5, 0]} intensity={0.2} />
    </group>
  );
}
