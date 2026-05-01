import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBeltStore } from "@/store/useBeltStore";

interface ConveyorBeltProps {
  length: number;   // metres
  width: number;    // metres (belt width)
  speed: number;    // m/s
}

// ── Belt cross-section profile (trough shape) ─────────────────────────────────
// Standard 3-roll idler: centre flat + two wing rollers at TROUGH_ANGLE degrees
const TROUGH_ANGLE = 35 * (Math.PI / 180); // 35° — industry standard
const IDLER_SPACING = 1.5;                  // metres between idler sets
const IDLER_RADIUS  = 0.063;               // 63mm radius (standard 127mm dia)
const PULLEY_RADIUS    = 0.25;             // 250mm head/tail pulley radius
const FRAME_H          = 1.1;             // height of frame above ground
const LEG_SPACING      = 3.0;             // metres between support legs
// Pulley centre Y: bottom of pulley flush with return belt (−FRAME_H*0.5)
const PULLEY_CENTER_Y  = -FRAME_H * 0.5 + PULLEY_RADIUS; // −0.30 m

/**
 * Build the belt cross-section profile as a THREE.Shape.
 * The belt forms a U-trough: flat centre + angled wings.
 *   bw = belt width (m)
 *   Returns array of 2D points (x, y) describing the top surface profile.
 */
function buildTroughProfile(bw: number): THREE.Vector2[] {
  const halfFlat  = bw * 0.33;   // centre flat section = 33% of belt width
  const wingLen   = bw * 0.335;  // each wing = 33.5% of belt width

  const pts: THREE.Vector2[] = [];
  // Left wing tip (highest point)
  pts.push(new THREE.Vector2(-halfFlat - wingLen * Math.cos(TROUGH_ANGLE),
                              wingLen * Math.sin(TROUGH_ANGLE)));
  // Left wing root (where it meets the flat)
  pts.push(new THREE.Vector2(-halfFlat, 0));
  // Right wing root
  pts.push(new THREE.Vector2( halfFlat, 0));
  // Right wing tip
  pts.push(new THREE.Vector2( halfFlat + wingLen * Math.cos(TROUGH_ANGLE),
                               wingLen * Math.sin(TROUGH_ANGLE)));
  return pts;
}

// ── Roller (cylinder) ─────────────────────────────────────────────────────────
function Roller({
  position, rotation, radius, length: rLen, color = "#475569",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  length: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[radius, radius, rLen, 16]} />
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
    </mesh>
  );
}

// ── Single 3-roll idler set ───────────────────────────────────────────────────
function IdlerSet({ z, bw }: { z: number; bw: number }) {
  const halfFlat = bw * 0.33;
  const wingLen  = bw * 0.335;

  // Centre roller — horizontal, flat
  const centreLen = halfFlat * 2 + 0.04;

  // Wing roller geometry
  const wingX = halfFlat + wingLen * 0.5 * Math.cos(TROUGH_ANGLE);
  const wingY = wingLen * 0.5 * Math.sin(TROUGH_ANGLE);

  return (
    <group position={[0, 0, z]}>
      {/* Centre roller */}
      <Roller
        position={[0, -IDLER_RADIUS, 0]}
        rotation={[0, 0, Math.PI / 2]}
        radius={IDLER_RADIUS}
        length={centreLen}
      />

      {/* Left wing roller — angled up at TROUGH_ANGLE */}
      <Roller
        position={[-wingX, wingY - IDLER_RADIUS, 0]}
        rotation={[0, 0, Math.PI / 2 - TROUGH_ANGLE]}
        radius={IDLER_RADIUS}
        length={wingLen + 0.04}
      />

      {/* Right wing roller */}
      <Roller
        position={[wingX, wingY - IDLER_RADIUS, 0]}
        rotation={[0, 0, Math.PI / 2 + TROUGH_ANGLE]}
        radius={IDLER_RADIUS}
        length={wingLen + 0.04}
      />

      {/* Idler frame cross-bar */}
      <mesh position={[0, -IDLER_RADIUS * 2 - 0.04, 0]}>
        <boxGeometry args={[bw + 0.15, 0.03, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Return idler (flat, underneath) ──────────────────────────────────────────
function ReturnIdler({ z, bw }: { z: number; bw: number }) {
  return (
    <Roller
      position={[0, -FRAME_H * 0.55, z]}
      rotation={[0, 0, Math.PI / 2]}
      radius={IDLER_RADIUS}
      length={bw * 0.9}
      color="#334155"
    />
  );
}

// ── Support leg assembly ──────────────────────────────────────────────────────
function SupportLeg({ z, bw }: { z: number; bw: number }) {
  const legH = FRAME_H;
  const legX = bw / 2 + 0.12;

  return (
    <group position={[0, -legH / 2, z]}>
      {/* Left leg */}
      <mesh position={[-legX, 0, 0]} castShadow>
        <boxGeometry args={[0.06, legH, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right leg */}
      <mesh position={[legX, 0, 0]} castShadow>
        <boxGeometry args={[0.06, legH, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Horizontal cross-brace */}
      <mesh position={[0, -legH * 0.25, 0]}>
        <boxGeometry args={[legX * 2 + 0.06, 0.05, 0.05]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Diagonal brace left */}
      <mesh position={[-legX * 0.5, -legH * 0.12, 0]}
        rotation={[0, 0, Math.atan2(legH * 0.25, legX)]}>
        <boxGeometry args={[0.04, Math.sqrt(legH * legH * 0.0625 + legX * legX), 0.04]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Trough belt surface (extruded along Z) ────────────────────────────────────
function TroughBeltSurface({
  length: bLen, width: bw, speed: bSpeed, plcRunning,
}: {
  length: number; width: number; speed: number; plcRunning: boolean;
}) {
  const offsetRef = useRef(0);

  // Build belt texture — dark rubber with transverse chevron lines
  const beltTex = useMemo(() => {
    const W = 512, H = 128;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Base rubber colour
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(0, 0, W, H);

    // Transverse ribs (every 32px)
    ctx.strokeStyle = "#292524";
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Yellow edge stripes
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 0, W, 6);
    ctx.fillRect(0, H - 6, W, 6);

    // Centre line
    ctx.strokeStyle = "#f59e0b44";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(bLen / 1.5, 1);
    return tex;
  }, [bLen]);

  // Build trough cross-section shape
  const { geometry } = useMemo(() => {
    const profile = buildTroughProfile(bw);

    // Create a CatmullRomCurve3 path along Z axis
    const path = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, -bLen / 2),
      new THREE.Vector3(0, 0,  bLen / 2)
    );

    // Build geometry by extruding the profile along Z
    // We use BufferGeometry manually for a ruled surface
    const segments = Math.ceil(bLen * 4); // 4 segments per metre
    const profilePts = profile;
    const N = profilePts.length;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let si = 0; si <= segments; si++) {
      const z = -bLen / 2 + (si / segments) * bLen;
      const u = si / segments;
      for (let pi = 0; pi < N; pi++) {
        const p = profilePts[pi];
        positions.push(p.x, p.y, z);
        uvs.push(u, pi / (N - 1));
      }
    }

    // Triangulate the strip
    for (let si = 0; si < segments; si++) {
      for (let pi = 0; pi < N - 1; pi++) {
        const a = si * N + pi;
        const b = si * N + pi + 1;
        const c = (si + 1) * N + pi;
        const d = (si + 1) * N + pi + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { geometry: geo };
  }, [bLen, bw]);

  // Animate texture offset
  useFrame((_, delta) => {
    if (!plcRunning) return;
    offsetRef.current += delta * bSpeed * 0.15;
    beltTex.offset.x = offsetRef.current;
  });

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        map={beltTex}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Return belt (flat, underneath) ───────────────────────────────────────────
function ReturnBelt({
  length: bLen, width: bw, speed: bSpeed, plcRunning,
}: {
  length: number; width: number; speed: number; plcRunning: boolean;
}) {
  const offsetRef = useRef(0);
  const returnTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 24) {
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(x, 0, 12, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(bLen / 1.5, 1);
    return tex;
  }, [bLen]);

  useFrame((_, delta) => {
    if (!plcRunning) return;
    offsetRef.current -= delta * bSpeed * 0.15; // return belt moves opposite
    returnTex.offset.x = offsetRef.current;
  });

  return (
    <mesh position={[0, -FRAME_H * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[bw * 0.85, bLen]} />
      <meshStandardMaterial
        map={returnTex}
        roughness={0.9}
        metalness={0.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Head / Tail pulley ────────────────────────────────────────────────────────
function Pulley({
  z, bw, isHead,
}: {
  z: number; bw: number; isHead: boolean;
}) {
  const color = isHead ? "#334155" : "#1e293b";
  return (
    // Positioned so bottom of pulley = return belt level, top ≈ carrying belt level
    <group position={[0, PULLEY_CENTER_Y, z]}>
      {/* Main drum */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[PULLEY_RADIUS, PULLEY_RADIUS, bw + 0.1, 32]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Shaft stubs */}
      {[-bw / 2 - 0.12, bw / 2 + 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.18, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Bearing housings */}
      {[-bw / 2 - 0.06, bw / 2 + 0.06].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.12, 0.18, 0.12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── Pulley belt wrap (connects top carrying belt to bottom return belt) ────────
// Creates an animated half-cylinder belt strip wrapping around each pulley end.
function PulleyWrap({
  z, bw, isHead, speed, plcRunning,
}: {
  z: number; bw: number; isHead: boolean; speed: number; plcRunning: boolean;
}) {
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const offsetRef = useRef(0);

  // Rubber belt texture — same style as carry belt
  const tex = useMemo(() => {
    const W = 256, H = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#292524";
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 0, W, 5);
    ctx.fillRect(0, H - 5, W, 5);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1); // ~πR * 2 repeats around half circle
    return t;
  }, []);

  // Animated half-circle wrap geometry
  const geometry = useMemo(() => {
    const SEGS     = 48;
    const r        = PULLEY_RADIUS + 0.008; // sit just outside the drum
    const halfW    = (bw * 0.85) / 2;

    // Head (+z end): belt wraps on the outer (+z) side of the pulley.
    //   angle goes from π/2 (top) → 0 (rightmost) → −π/2 (bottom), stepping CW.
    // Tail (−z end): wraps on the outer (−z) side, mirror image.
    const startA = Math.PI / 2;   // top of pulley
    const endA   = -Math.PI / 2;  // bottom of pulley

    const positions: number[] = [];
    const uvs:       number[] = [];
    const indices:   number[] = [];

    for (let i = 0; i <= SEGS; i++) {
      const t    = i / SEGS;
      const angle = startA + (endA - startA) * t;
      const y    = PULLEY_CENTER_Y + r * Math.sin(angle);
      // For head: extend in +z; for tail: extend in −z
      const dz   = isHead ? r * Math.cos(angle) : -r * Math.cos(angle);

      positions.push(-halfW, y, dz,
                      halfW, y, dz);
      uvs.push(t, 0, t, 1);
    }

    for (let i = 0; i < SEGS; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [bw, isHead]);

  // Scroll texture in sync with belt (carrying direction = positive offset)
  useFrame((_, delta) => {
    if (!plcRunning || !matRef.current) return;
    // Head: belt goes over top → wrap scrolls same direction as carry
    // Tail: belt comes under → same but could be inverted; visually same works fine
    offsetRef.current += delta * speed * 0.15;
    matRef.current.map!.offset.x = offsetRef.current;
  });

  return (
    <mesh geometry={geometry} position={[0, 0, z]} castShadow receiveShadow>
      <meshStandardMaterial
        ref={matRef}
        map={tex}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Side frame rails ──────────────────────────────────────────────────────────
function FrameRails({ length: bLen, bw }: { length: number; bw: number }) {
  const railX = bw / 2 + 0.18;
  return (
    <>
      {[-railX, railX].map((x, i) => (
        <mesh key={i} position={[x, -0.04, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, bLen - 0.3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ConveyorBelt({ length, width, speed }: ConveyorBeltProps) {
  const plcRunning = useBeltStore((s) => s.plcBeltRunning);
  const halfLen    = length / 2;

  // Idler set positions along Z
  const idlerPositions = useMemo(() => {
    const positions: number[] = [];
    const count = Math.floor(length / IDLER_SPACING);
    for (let i = 0; i <= count; i++) {
      positions.push(-halfLen + i * IDLER_SPACING);
    }
    return positions;
  }, [length, halfLen]);

  // Return idler positions (every 3m)
  const returnIdlerPositions = useMemo(() => {
    const positions: number[] = [];
    const count = Math.floor(length / 3);
    for (let i = 0; i <= count; i++) {
      positions.push(-halfLen + i * 3);
    }
    return positions;
  }, [length, halfLen]);

  // Support leg positions
  const legPositions = useMemo(() => {
    const positions: number[] = [];
    const count = Math.floor(length / LEG_SPACING);
    for (let i = 0; i <= count; i++) {
      positions.push(-halfLen + i * LEG_SPACING);
    }
    return positions;
  }, [length, halfLen]);

  return (
    <group>
      {/* ── Trough belt surface (top, carrying side) ── */}
      <TroughBeltSurface
        length={length}
        width={width}
        speed={speed}
        plcRunning={plcRunning}
      />

      {/* ── Return belt (bottom, flat) ── */}
      <ReturnBelt
        length={length}
        width={width}
        speed={speed}
        plcRunning={plcRunning}
      />

      {/* ── 3-roll idler sets ── */}
      {idlerPositions.map((z, i) => (
        <IdlerSet key={i} z={z} bw={width} />
      ))}

      {/* ── Return idlers ── */}
      {returnIdlerPositions.map((z, i) => (
        <ReturnIdler key={i} z={z} bw={width} />
      ))}

      {/* ── Head pulley (drive end) ── */}
      <Pulley z={halfLen - 0.05} bw={width} isHead />

      {/* ── Tail pulley ── */}
      <Pulley z={-halfLen + 0.05} bw={width} isHead={false} />

      {/* ── Belt wraps — connect carry & return belt at each pulley ── */}
      <PulleyWrap z={halfLen - 0.05}  bw={width} isHead speed={speed} plcRunning={plcRunning} />
      <PulleyWrap z={-halfLen + 0.05} bw={width} isHead={false} speed={speed} plcRunning={plcRunning} />

      {/* ── Side frame rails ── */}
      <FrameRails length={length} bw={width} />

      {/* ── Support legs ── */}
      {legPositions.map((z, i) => (
        <SupportLeg key={i} z={z} bw={width} />
      ))}

      {/* ── Ground skirt plates (dust containment) ── */}
      {[-width / 2 - 0.02, width / 2 + 0.02].map((x, i) => (
        <mesh key={i} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.015, 0.22, length - 0.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
