import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBeltStore } from '@/store/useBeltStore';

interface ConveyorBeltProps {
  length: number;
  width: number;
  speed: number;   // m/s — drives texture scroll
}

/**
 * Procedural conveyor belt:
 * - Flat belt surface with animated UV scroll
 * - Two end rollers
 * - Side frame rails
 * - Support legs
 *
 * NOTE: A slot is reserved for a Unity/Blender GLTF model.
 * When the model is ready, replace this component with a <primitive> or <useGLTF> call.
 */
export default function ConveyorBelt({ length, width, speed }: ConveyorBeltProps) {
  const beltRef   = useRef<THREE.Mesh>(null);
  const offsetRef = useRef(0);
  const plcRunning = useBeltStore((s) => s.plcBeltRunning);

  // Animated belt texture (stripe pattern via canvas)
  const beltTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark base
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    // Belt stripes
    for (let i = 0; i < size; i += 32) {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(i, 0, 16, size);
    }

    // Edge lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(length / 2, 1);
    return tex;
  }, [length]);

  // Scroll texture to simulate belt movement — freeze when PLC stopped
  useFrame((_, delta) => {
    if (!plcRunning) return;
    offsetRef.current += delta * speed * 0.1;
    beltTexture.offset.x = offsetRef.current;
  });

  const halfLen = length / 2;

  return (
    <group>
      {/* ── Belt surface ── */}
      <mesh
        ref={beltRef}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[width, 0.06, length]} />
        <meshStandardMaterial
          map={beltTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* ── Side rails ── */}
      {[-width / 2 - 0.05, width / 2 + 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.06, 0.18, length]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* ── Support legs ── */}
      {Array.from({ length: Math.floor(length / 4) }, (_, i) => {
        const z = -halfLen + 2 + i * 4;
        return (
          <group key={i} position={[0, -1.2, z]}>
            {[-width / 2 + 0.1, width / 2 - 0.1].map((x, j) => (
              <mesh key={j} position={[x, 0, 0]}>
                <boxGeometry args={[0.08, 2.4, 0.08]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
            {/* Cross brace */}
            <mesh position={[0, -0.6, 0]}>
              <boxGeometry args={[width - 0.1, 0.06, 0.06]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* ── PLACEHOLDER: Unity / Blender GLTF model ──
          When your 3D model is ready, replace the geometry above with:

          import { useGLTF } from '@react-three/drei';
          const { scene } = useGLTF('/models/conveyor_belt.glb');
          return <primitive object={scene} />;

          Place your .glb file in: frontend/public/models/
      ── */}
    </group>
  );
}
