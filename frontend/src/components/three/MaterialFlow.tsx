import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBeltStore } from '@/store/useBeltStore';

interface MaterialFlowProps {
  beltLength: number;
  beltWidth: number;
  speed: number;
  massFlowRate: number;
  /** 0 = empty belt, 100 = max heavy load */
  materialLoad: number;
}

const MAX_PARTICLES = 600;

/**
 * Material load levels:
 *  0–20   → Light dust / fines   (tiny, sparse, grey)
 *  21–50  → Medium ore / gravel  (medium, moderate, brown-grey)
 *  51–80  → Heavy coal / rock    (large, dense, dark)
 *  81–100 → Max overload         (very large, packed, near-black with red tint)
 */
function loadProfile(load: number) {
  const t = load / 100;

  // Particle count: 40 → 600
  const count = Math.round(40 + t * (MAX_PARTICLES - 40));

  // Particle size: 0.04 → 0.28
  const size = 0.04 + t * 0.24;

  // Pile height above belt: 0.06 → 0.45
  const heapHeight = 0.06 + t * 0.39;

  // Spread width factor: 0.4 → 0.85 of belt width
  const spread = 0.4 + t * 0.45;

  // Color: light grey → dark brown → near-black with red tint
  const color = new THREE.Color().lerpColors(
    new THREE.Color('#a8a29e'),   // light fines
    new THREE.Color('#292524'),   // heavy coal
    Math.min(t * 1.2, 1)
  );
  // Add red tint at overload (>80%)
  if (load > 80) {
    const overT = (load - 80) / 20;
    color.lerp(new THREE.Color('#7f1d1d'), overT * 0.5);
  }

  // Opacity: 0.55 → 0.95
  const opacity = 0.55 + t * 0.4;

  return { count, size, heapHeight, spread, color, opacity };
}

export default function MaterialFlow({
  beltLength,
  beltWidth,
  speed,
  massFlowRate,
  materialLoad,
}: MaterialFlowProps) {
  const meshRef       = useRef<THREE.Points>(null);
  const profile       = loadProfile(materialLoad);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(MAX_PARTICLES));
  const plcRunning    = useBeltStore((s) => s.plcBeltRunning);

  // Build full-size buffer once — we'll only render `profile.count` particles
  const positions = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const vel = new Float32Array(MAX_PARTICLES);
    const TROUGH_ANGLE = 35 * (Math.PI / 180);
    const halfFlat = beltWidth * 0.33;
    const wingLen  = beltWidth * 0.335;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Place particles inside the trough cross-section
      const xRand = (Math.random() - 0.5) * beltWidth * profile.spread;
      // Compute Y based on trough profile so particles sit on the belt surface
      const absX = Math.abs(xRand);
      let yBase = 0;
      if (absX > halfFlat) {
        // On the wing — follow the angled surface
        const wingDist = absX - halfFlat;
        yBase = wingDist * Math.tan(TROUGH_ANGLE);
      }
      pos[i * 3]     = xRand;
      pos[i * 3 + 1] = yBase + 0.03 + Math.random() * profile.heapHeight;
      pos[i * 3 + 2] = (Math.random() - 0.5) * beltLength;
      vel[i]          = speed * (0.75 + Math.random() * 0.5);
    }
    velocitiesRef.current = vel;
    return pos;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beltLength, beltWidth, speed]);

  // When load changes, re-scatter particles so the pile looks right
  useEffect(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const p   = loadProfile(materialLoad);
    const TROUGH_ANGLE = 35 * (Math.PI / 180);
    const halfFlat = beltWidth * 0.33;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const xRand = (Math.random() - 0.5) * beltWidth * p.spread;
      const absX  = Math.abs(xRand);
      let yBase = 0;
      if (absX > halfFlat) {
        yBase = (absX - halfFlat) * Math.tan(TROUGH_ANGLE);
      }
      pos[i * 3]     = xRand;
      pos[i * 3 + 1] = yBase + 0.03 + Math.random() * p.heapHeight;
      pos[i * 3 + 2] = (Math.random() - 0.5) * beltLength;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.setDrawRange(0, p.count);
  }, [materialLoad, beltLength, beltWidth]);

  useFrame((_, delta) => {
    if (!meshRef.current || !plcRunning) return;  // freeze when PLC stopped
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    const p   = loadProfile(materialLoad);

    for (let i = 0; i < p.count; i++) {
      pos[i * 3 + 2] += vel[i] * delta;
      if (pos[i * 3 + 2] > beltLength / 2) {
        pos[i * 3]     = (Math.random() - 0.5) * beltWidth * p.spread;
        pos[i * 3 + 1] = 0.03 + Math.random() * p.heapHeight;
        pos[i * 3 + 2] = -beltLength / 2;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry onUpdate={(g) => g.setDrawRange(0, profile.count)}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={MAX_PARTICLES}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={profile.size}
        color={profile.color}
        sizeAttenuation
        transparent
        opacity={profile.opacity}
        depthWrite={false}
      />
    </points>
  );
}
