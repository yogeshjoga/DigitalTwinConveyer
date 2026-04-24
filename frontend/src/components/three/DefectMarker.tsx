import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { VisionDetection } from '@/types';

interface DefectMarkerProps {
  detection: VisionDetection;
  beltLength: number;
}

const severityColor: Record<string, string> = {
  low:    '#f59e0b',
  medium: '#f97316',
  high:   '#ef4444',
};

export default function DefectMarker({ detection, beltLength }: DefectMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Pulse animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * 3) * 0.15
      );
    }
  });

  // Map detection position (0–1 normalized) to world Z
  const z = -beltLength / 2 + detection.position.x * beltLength;
  const x = (detection.position.y - 0.5) * 1.0;
  const color = severityColor[detection.severity];

  return (
    <group position={[x, 0.15, z]}>
      <mesh ref={meshRef}>
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      <Html distanceFactor={8} center>
        <div
          className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap pointer-events-none"
          style={{
            background: `${color}22`,
            border: `1px solid ${color}`,
            color,
          }}
        >
          {detection.defectType.replace('_', ' ').toUpperCase()}
          <br />
          <span className="font-normal opacity-75">
            {Math.round(detection.confidence * 100)}% conf.
          </span>
        </div>
      </Html>
    </group>
  );
}
