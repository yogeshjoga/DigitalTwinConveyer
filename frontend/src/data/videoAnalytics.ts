import type { DefectType } from "@/types";

export interface VideoEvent {
  id: string;
  beltId: string;
  beltName: string;
  material: string;
  timestamp: string;
  videoTimestamp: number;
  defectType: DefectType;
  severity: "low" | "medium" | "high";
  confidence: number;
  bbox: [number, number, number, number];
  beltPosition: number;
  camera: "CAM-01" | "CAM-02" | "CAM-03" | "CAM-04";
  frameNumber: number;
}

function makeEvents(): VideoEvent[] {
  const belts = [
    { id: "COAL-CHP-01",      name: "Coal Belt 1",           material: "Coal"        },
    { id: "RM-IRONORE-01",    name: "Iron Ore Belt 1",       material: "Iron Ore"    },
    { id: "RM-IRONORE-02",    name: "Iron Ore Belt 2",       material: "Iron Ore"    },
    { id: "SINTER-DISCH-01",  name: "Sinter Discharge Belt", material: "Hot Sinter"  },
    { id: "BF-BURDEN-01",     name: "Burden Belt",           material: "Burden"      },
  ];
  const defects: DefectType[] = ["tear", "hole", "edge_damage", "layer_peeling"];
  const cameras = ["CAM-01", "CAM-02", "CAM-03", "CAM-04"] as const;
  const severities = ["low", "medium", "high"] as const;
  const events: VideoEvent[] = [];
  let id = 1;
  const now = Date.now();
  for (let h = 0; h < 48; h++) {
    const baseTime = now - h * 3_600_000;
    const count = 2 + (id % 5);
    for (let e = 0; e < count; e++) {
      const belt   = belts[(id + e) % belts.length];
      const defect = defects[(id * 3 + e) % defects.length];
      const sev    = severities[(id + e * 2) % severities.length];
      const cam    = cameras[(id + e) % cameras.length];
      const minOff = Math.floor((e / count) * 60);
      const ts     = new Date(baseTime - minOff * 60_000);
      const vt     = ((id * 17 + e * 7) % 340) / 100;
      events.push({
        id:             `evt-${String(id).padStart(4, "0")}`,
        beltId:         belt.id,
        beltName:       belt.name,
        material:       belt.material,
        timestamp:      ts.toISOString(),
        videoTimestamp: vt,
        defectType:     defect,
        severity:       sev,
        confidence:     0.65 + ((id * 13 + e * 7) % 35) / 100,
        bbox:           [
          80  + (id * 37 + e * 11) % 900,
          40  + (id * 23 + e * 17) % 500,
          50  + (id * 11 + e * 5)  % 200,
          30  + (id * 7  + e * 3)  % 120,
        ],
        beltPosition:   5 + (id * 19 + e * 13) % 90,
        camera:         cam,
        frameNumber:    (id * 30 + e * 7) % 9000,
      });
      id++;
    }
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const VIDEO_EVENTS: VideoEvent[] = makeEvents();

export const DEFECT_COLORS: Record<DefectType, string> = {
  tear:          "#ef4444",
  hole:          "#f97316",
  edge_damage:   "#f59e0b",
  layer_peeling: "#a855f7",
  none:          "#22c55e",
};

export const DEFECT_LABELS: Record<DefectType, string> = {
  tear:          "Tear",
  hole:          "Hole",
  edge_damage:   "Edge Damage",
  layer_peeling: "Layer Peeling",
  none:          "No Defect",
};
