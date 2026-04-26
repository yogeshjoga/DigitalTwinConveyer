import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
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

const DEFECT_LABELS: Record<string, string> = {
  tear:          'Tear',
  hole:          'Hole',
  edge_damage:   'Edge Damage',
  layer_peeling: 'Layer Peeling',
};

export default function DefectMarker({ detection, beltLength }: DefectMarkerProps) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const navigate = useNavigate();

  // Pulse animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * 3) * 0.15
      );
    }
  });

  const z     = -beltLength / 2 + detection.position.x * beltLength;
  const x     = (detection.position.y - 0.5) * 1.0;
  const color = severityColor[detection.severity];

  const handleClick = () => {
    // Navigate to Vision page and pass the detection id so the modal auto-opens
    navigate('/vision', { state: { openDetectionId: detection.id } });
  };

  return (
    <group position={[x, 0.15, z]}>
      <mesh ref={meshRef}>
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      <Html distanceFactor={8} center>
        <div
          onClick={handleClick}
          title="Click to open full defect details"
          style={{
            background: `${color}22`,
            border: `1px solid ${color}`,
            color,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            userSelect: 'none',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.15s ease',
            boxShadow: `0 0 8px ${color}44`,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.background = `${color}44`;
            el.style.transform = 'scale(1.08)';
            el.style.boxShadow = `0 0 16px ${color}88`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.background = `${color}22`;
            el.style.transform = 'scale(1)';
            el.style.boxShadow = `0 0 8px ${color}44`;
          }}
        >
          {(DEFECT_LABELS[detection.defectType] ?? detection.defectType.replace('_', ' ')).toUpperCase()}
          <br />
          <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 10 }}>
            {Math.round(detection.confidence * 100)}% conf.
          </span>
          <br />
          <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 9 }}>
            🔍 Click for details
          </span>
        </div>
      </Html>
    </group>
  );
}
