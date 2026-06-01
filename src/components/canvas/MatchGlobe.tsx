'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMatchStore, Match } from '@/store/useMatchStore';
import { Line } from '@react-three/drei';

// Convert lat/long to 3D sphere coordinate
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

export default function MatchGlobe() {
  const { upcomingMatches, selectedMatchId, setSelectedMatch } = useMatchStore();
  const globeRef = useRef<THREE.Group>(null);
  const R = 2.2; // Globe radius

  const selectedMatch = useMemo(() => {
    return upcomingMatches.find(m => m.id === selectedMatchId) || null;
  }, [upcomingMatches, selectedMatchId]);

  // Handle slow continuous rotation when no match is selected or mouse is idle
  useFrame((state, delta) => {
    if (globeRef.current) {
      if (selectedMatch) {
        // Smoothly lerp towards selected match location
        const targetPos = latLongToVector3(
          selectedMatch.venue.latitude,
          selectedMatch.venue.longitude,
          R
        );
        
        // Find rotation to align selected match location with front (0, 0, Z)
        // For simplicity, we can smoothly lerp rotation to face the target position
        const targetRotationY = -Math.atan2(targetPos.x, targetPos.z);
        const targetRotationX = Math.atan2(targetPos.y, Math.sqrt(targetPos.x * targetPos.x + targetPos.z * targetPos.z));

        globeRef.current.rotation.y = THREE.MathUtils.lerp(globeRef.current.rotation.y, targetRotationY, 0.05);
        globeRef.current.rotation.x = THREE.MathUtils.lerp(globeRef.current.rotation.x, targetRotationX, 0.05);
      } else {
        // Slow auto-rotation
        globeRef.current.rotation.y += 0.003;
      }
    }
  });

  // Calculate coordinates for all venues
  const venuePins = useMemo(() => {
    return upcomingMatches.map((match) => {
      const { venue, prediction } = match;
      const position = latLongToVector3(venue.latitude, venue.longitude, R);
      
      // Calculate normal vector pointing out of the sphere
      const normal = position.clone().normalize();
      
      // glowing vector height based on confidence
      const confidence = prediction ? Math.max(prediction.homeWinConfidence, prediction.awayWinConfidence) : 0.6;
      const pinHeight = 0.5 + confidence * 0.8;
      
      const pinEndPosition = position.clone().add(normal.multiplyScalar(pinHeight));
      
      // color based on confidence rating
      const color = confidence > 0.65 ? '#10b981' : confidence > 0.55 ? '#3b82f6' : '#f59e0b'; // Emerald, Blue, Amber

      return {
        matchId: match.id,
        start: position,
        end: pinEndPosition,
        color,
        venueName: venue.name,
        teams: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
      };
    });
  }, [upcomingMatches]);

  return (
    <group ref={globeRef}>
      {/* Ambient background light inside the globe for a gorgeous cyber glow */}
      <mesh>
        <sphereGeometry args={[R - 0.05, 32, 32]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.7} />
      </mesh>

      {/* Earth wireframe representing the digital grid */}
      <mesh>
        <sphereGeometry args={[R, 36, 36]} />
        <meshBasicMaterial 
          color="#1e293b" 
          wireframe 
          transparent 
          opacity={0.3} 
        />
      </mesh>

      {/* Continent contour or secondary sphere grid */}
      <mesh>
        <sphereGeometry args={[R + 0.01, 16, 16]} />
        <meshBasicMaterial 
          color="#334155" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </mesh>

      {/* Glow equator line */}
      <gridHelper args={[R * 2.1, 8, '#0f172a', '#475569']} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Holographic Glowing stadium location pins and shooting arcs */}
      {venuePins.map((pin, i) => {
        const isSelected = pin.matchId === selectedMatchId;
        return (
          <group key={pin.matchId}>
            {/* The Stadium Dot on Earth Surface */}
            <mesh 
              position={pin.start}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMatch(pin.matchId);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.08 : 0.04, 16, 16]} />
              <meshBasicMaterial 
                color={pin.color} 
                toneMapped={false}
              />
            </mesh>

            {/* Glowing vertical holographic line shooting up */}
            <Line
              points={[pin.start, pin.end]}
              color={pin.color}
              lineWidth={isSelected ? 3 : 1}
            />

            {/* Glowing pin head */}
            <mesh position={pin.end}>
              <sphereGeometry args={[isSelected ? 0.05 : 0.02, 8, 8]} />
              <meshBasicMaterial color={pin.color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
