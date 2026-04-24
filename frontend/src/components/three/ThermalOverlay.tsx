import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThermalZone } from '@/types';

interface ThermalOverlayProps {
  zone: ThermalZone;
  beltLength: number;
  beltWidth: number;
}

/** Maps temperature to a heat-map color (blue → green → yellow → red) */
function tempToColor(temp: number): THREE.Color {
  const t = Math.min(Math.max((temp - 20) / 180, 0), 1); // normalize 20–200°C
  if (t < 0.33) return new THREE.Color().lerpColors(new THREE.Color('#3b82f6'), new THREE.Color('#22c55e'), t / 0.33);
  if (t < 0.66) return new THREE.Color().lerpColors(new THREE.Color('#22c55e'), new THREE.Color('#f59e0b'), (t - 0.33) / 0.33);
  return new THREE.Color().lerpColors(new THREE.Color('#f59e0b'), new THREE.Color('#ef4444'), (t - 0.66) / 0.34);
}

export default function ThermalOverlay({ zone, beltLength, beltWidth }: ThermalOverlayProps) {
  const color = useMemo(() => tempToColor(zone.temperature), [zone.temperature]);

  // Map zone.position (0–beltLength) to world Z
  const z = -beltLength / 2 + zone.position;

  return (
    <mesh position={[0, 0.04, z]}>
      <planeGeometry args={[beltWidth * 0.9, 0.8]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.45}
        emissive={color}
        emissiveIntensity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}
