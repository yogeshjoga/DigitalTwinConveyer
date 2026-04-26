import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Grid,
  Text,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import type { SensorReading, ThermalZone, VisionDetection } from '@/types';
import ConveyorBelt from './ConveyorBelt';
import ThermalOverlay from './ThermalOverlay';
import DefectMarker from './DefectMarker';
import MaterialFlow from './MaterialFlow';
import { useBeltStore } from '@/store/useBeltStore';

export type CameraPreset = 'perspective' | 'front' | 'side' | 'top' | 'bottom';

// Camera positions per preset [x, y, z] and target [x, y, z]
const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  perspective: { pos: [0, 8, 18],   target: [0, 0, 0] },
  front:       { pos: [0, 1, 22],   target: [0, 0, 0] },
  side:        { pos: [18, 2, 0],   target: [0, 0, 0] },
  top:         { pos: [0, 22, 0.01],target: [0, 0, 0] },
  bottom:      { pos: [0, -10, 0.01],target: [0, 0, 0] },
};

interface BeltSceneProps {
  beltLength?: number;
  beltWidth?: number;
  beltSpeed?: number;
  sensorData?: SensorReading;
  thermalZones?: ThermalZone[];
  detections?: VisionDetection[];
  showThermal?: boolean;
  showMaterial?: boolean;
  cameraPreset?: CameraPreset;
  /** 0 = empty, 100 = max heavy load */
  materialLoad?: number;
}

/** Inner component — has access to useThree */
function SceneContent({
  beltLength,
  beltWidth,
  beltSpeed,
  sensorData,
  thermalZones,
  detections,
  showThermal,
  showMaterial,
  cameraPreset,
  materialLoad,
}: Required<BeltSceneProps>) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const selectedBelt = useBeltStore((s) => s.selectedBeltEntry);

  // Animate camera to preset when it changes
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;

    const [px, py, pz] = preset.pos;
    const [tx, ty, tz] = preset.target;

    // Smooth lerp via requestAnimationFrame
    const startPos    = camera.position.clone();
    const endPos      = new THREE.Vector3(px, py, pz);
    const startTarget = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);
    const endTarget = new THREE.Vector3(tx, ty, tz);

    let t = 0;
    const duration = 60; // frames

    const animate = () => {
      t++;
      const alpha = Math.min(t / duration, 1);
      const ease  = 1 - Math.pow(1 - alpha, 3); // cubic ease-out

      camera.position.lerpVectors(startPos, endPos, ease);

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
        controlsRef.current.update();
      }

      if (alpha < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [cameraPreset]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />

      <Environment preset="warehouse" />

      <Grid
        args={[50, 50]}
        position={[0, -0.6, 0]}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={40}
      />

      <ConveyorBelt length={beltLength} width={beltWidth} speed={beltSpeed} />

      {showThermal && thermalZones.map((zone) => (
        <ThermalOverlay key={zone.id} zone={zone} beltLength={beltLength} beltWidth={beltWidth} />
      ))}

      {detections.filter((d) => d.defectType !== 'none').map((d) => (
        <DefectMarker key={d.id} detection={d} beltLength={beltLength} />
      ))}

      {showMaterial && (
        <MaterialFlow
          beltLength={beltLength}
          beltWidth={beltWidth}
          speed={beltSpeed}
          massFlowRate={sensorData?.loadCell ?? 100}
          materialLoad={materialLoad}
        />
      )}

      <Text position={[0, 2.5, -beltLength / 2 - 1]} fontSize={0.4} color="#94a3b8" anchorX="center">
        {selectedBelt.name}  ·  {selectedBelt.id}
      </Text>

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={40}
        maxPolarAngle={Math.PI}
      />
    </>
  );
}

export default function BeltScene({
  beltLength = 20,
  beltWidth = 1.2,
  beltSpeed = 2,
  sensorData,
  thermalZones = [],
  detections = [],
  showThermal = true,
  showMaterial = true,
  cameraPreset = 'perspective',
  materialLoad = 30,
}: BeltSceneProps) {
  const preset = CAMERA_PRESETS[cameraPreset];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-[#0a0f1a]">
      <Canvas
        camera={{ position: preset.pos, fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        className="three-canvas"
      >
        <Suspense fallback={<Html center><span className="text-white text-sm">Loading 3D scene…</span></Html>}>
          <SceneContent
            beltLength={beltLength}
            beltWidth={beltWidth}
            beltSpeed={beltSpeed}
            sensorData={sensorData ?? {} as SensorReading}
            thermalZones={thermalZones}
            detections={detections}
            showThermal={showThermal}
            showMaterial={showMaterial}
            cameraPreset={cameraPreset}
            materialLoad={materialLoad}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
