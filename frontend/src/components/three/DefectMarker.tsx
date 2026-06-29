import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import type { VisionDetection } from '@/types';
import { useBeltStore } from '@/store/useBeltStore';

interface DefectMarkerProps {
  detection: VisionDetection;
  beltLength: number;
  beltSpeed: number;
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

export default function DefectMarker({ detection, beltLength, beltSpeed }: DefectMarkerProps) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const navigate = useNavigate();
  const plcRunning = useBeltStore((s) => s.plcBeltRunning);
  
  // Base initial distance along the loop (0 to beltLength on top)
  const initialD = detection.position.x * beltLength;
  const offsetRef = useRef(0);

  // Pulse animation and movement
  useFrame(({ clock }, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * 3) * 0.15
      );
    }
    if (groupRef.current) {
      if (plcRunning) {
        // Match the visual texture scrolling speed: delta * speed * 0.15 (offset) * 1.5 (scale)
        offsetRef.current += delta * beltSpeed * 0.225;
      }
      
      const loopLen = beltLength * 2;
      let currentD = (initialD + offsetRef.current) % loopLen;
      if (currentD < 0) currentD += loopLen; // handle potential negative
      
      let currentZ;
      let currentY;
      
      if (currentD < beltLength) {
        // Top surface (moving forward)
        currentZ = -beltLength / 2 + currentD;
        currentY = 0.15;
      } else {
        // Bottom surface (moving backward)
        currentZ = beltLength / 2 - (currentD - beltLength);
        currentY = -0.7; // Just below the return belt which is at -0.55
      }
      
      groupRef.current.position.z = currentZ;
      groupRef.current.position.y = currentY;
    }
  });

  const x     = (detection.position.y - 0.5) * 1.0;
  const color = severityColor[detection.severity];

  const handleClick = () => {
    // Navigate to Vision page and pass the detection id so the modal auto-opens
    navigate('/vision', { state: { openDetectionId: detection.id } });
  };

  return (
    <group ref={groupRef} position={[x, 0.15, -beltLength / 2 + initialD]}>
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
