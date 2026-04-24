/**
 * Steel Industry Conveyor Belt Catalog
 * Format: [PLANT]-[AREA]-[MATERIAL]-[NUMBER]
 */

export interface BeltEntry {
  id: string;          // structured ID: BF-IRONORE-01
  name: string;        // display name: Iron Ore Belt 1
  area: string;        // group label
  areaCode: string;    // short code for badge
  color: string;       // area accent color
  material: string;    // material type
  description: string;
}

export const BELT_AREAS = [
  'Raw Material Handling',
  'Coal & Coke Handling',
  'Sinter Plant',
  'Blast Furnace Area',
  'Pellet Plant',
  'Slag Handling',
  'Finished Material / Rolling Mill',
  'Yard & Dispatch',
  'Special Purpose',
] as const;

export type BeltArea = typeof BELT_AREAS[number];

export const AREA_COLORS: Record<BeltArea, string> = {
  'Raw Material Handling':              '#3b82f6',
  'Coal & Coke Handling':               '#78716c',
  'Sinter Plant':                       '#f97316',
  'Blast Furnace Area':                 '#ef4444',
  'Pellet Plant':                       '#22c55e',
  'Slag Handling':                      '#a855f7',
  'Finished Material / Rolling Mill':   '#f59e0b',
  'Yard & Dispatch':                    '#06b6d4',
  'Special Purpose':                    '#64748b',
};

export const BELT_CATALOG: BeltEntry[] = [
  // ── Raw Material Handling ──────────────────────────────────────────────────
  { id: 'RM-IRONORE-01',  name: 'Iron Ore Belt 1',       area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Iron Ore',   description: 'Primary iron ore feed from stockyard' },
  { id: 'RM-IRONORE-02',  name: 'Iron Ore Belt 2',       area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Iron Ore',   description: 'Secondary iron ore feed line' },
  { id: 'RM-LUMPORE-01',  name: 'Lump Ore Belt',         area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Lump Ore',   description: 'Lump ore transfer to BF' },
  { id: 'RM-FINEORE-01',  name: 'Fine Ore Belt',         area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Fine Ore',   description: 'Fine ore to sinter plant' },
  { id: 'RM-LIME-01',     name: 'Limestone Belt 1',      area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Limestone',  description: 'Limestone primary feed' },
  { id: 'RM-LIME-02',     name: 'Limestone Belt 2',      area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Limestone',  description: 'Limestone secondary feed' },
  { id: 'RM-DOLO-01',     name: 'Dolomite Belt',         area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Dolomite',   description: 'Dolomite additive feed' },
  { id: 'RM-ADDITIVE-01', name: 'Additive Material Belt',area: 'Raw Material Handling', areaCode: 'RM', color: '#3b82f6', material: 'Additives',  description: 'Mixed additives conveyor' },

  // ── Coal & Coke Handling ───────────────────────────────────────────────────
  { id: 'COAL-CHP-01',    name: 'Coal Belt 1',           area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coal',       description: 'Primary coal handling' },
  { id: 'COAL-CHP-02',    name: 'Coal Belt 2',           area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coal',       description: 'Secondary coal handling' },
  { id: 'COAL-FEED-01',   name: 'Coal Feed Belt',        area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coal',       description: 'Coal feed to coke oven' },
  { id: 'COKE-CHP-01',    name: 'Coke Belt 1',           area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coke',       description: 'Primary coke transfer' },
  { id: 'COKE-CHP-02',    name: 'Coke Belt 2',           area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coke',       description: 'Secondary coke transfer' },
  { id: 'COKE-XFER-01',   name: 'Coke Transfer Belt',    area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'Coke',       description: 'Coke to BF transfer' },
  { id: 'COAL-PCI-01',    name: 'PCI Coal Belt',         area: 'Coal & Coke Handling',  areaCode: 'CC', color: '#78716c', material: 'PCI Coal',   description: 'Pulverized Coal Injection feed' },

  // ── Sinter Plant ───────────────────────────────────────────────────────────
  { id: 'SINTER-FEED-01', name: 'Sinter Feed Belt',      area: 'Sinter Plant',          areaCode: 'SP', color: '#f97316', material: 'Sinter Mix', description: 'Raw mix to sinter strand' },
  { id: 'SINTER-RFINE-01',name: 'Sinter Return Fines Belt',area:'Sinter Plant',          areaCode: 'SP', color: '#f97316', material: 'Return Fines','description': 'Return fines recirculation' },
  { id: 'SINTER-DISCH-01',name: 'Sinter Discharge Belt', area: 'Sinter Plant',          areaCode: 'SP', color: '#f97316', material: 'Hot Sinter', description: 'Hot sinter discharge' },
  { id: 'SINTER-COOL-01', name: 'Sinter Cooling Belt',   area: 'Sinter Plant',          areaCode: 'SP', color: '#f97316', material: 'Sinter',     description: 'Cooled sinter to BF' },

  // ── Blast Furnace Area ─────────────────────────────────────────────────────
  { id: 'BF-BURDEN-01',   name: 'Burden Belt',           area: 'Blast Furnace Area',    areaCode: 'BF', color: '#ef4444', material: 'Burden',     description: 'Mixed burden to BF top' },
  { id: 'BF-CHARGE-01',   name: 'Charging Belt',         area: 'Blast Furnace Area',    areaCode: 'BF', color: '#ef4444', material: 'Charge Mix', description: 'BF charging conveyor' },
  { id: 'BF-STOCK-01',    name: 'Stock House Belt 1',    area: 'Blast Furnace Area',    areaCode: 'BF', color: '#ef4444', material: 'Mixed',      description: 'Stock house primary' },
  { id: 'BF-STOCK-02',    name: 'Stock House Belt 2',    area: 'Blast Furnace Area',    areaCode: 'BF', color: '#ef4444', material: 'Mixed',      description: 'Stock house secondary' },
  { id: 'BF-FEED-01',     name: 'BF Feed Conveyor',      area: 'Blast Furnace Area',    areaCode: 'BF', color: '#ef4444', material: 'Mixed',      description: 'Main BF feed line' },

  // ── Pellet Plant ───────────────────────────────────────────────────────────
  { id: 'PEL-FEED-01',    name: 'Pellet Feed Belt',      area: 'Pellet Plant',          areaCode: 'PL', color: '#22c55e', material: 'Iron Ore',   description: 'Fine ore to pelletizer' },
  { id: 'PEL-GREEN-01',   name: 'Green Pellet Belt',     area: 'Pellet Plant',          areaCode: 'PL', color: '#22c55e', material: 'Green Pellets','description': 'Green pellets to induration' },
  { id: 'PEL-FIRED-01',   name: 'Fired Pellet Belt',     area: 'Pellet Plant',          areaCode: 'PL', color: '#22c55e', material: 'Pellets',    description: 'Fired pellets discharge' },
  { id: 'PEL-XFER-01',    name: 'Pellet Transfer Belt',  area: 'Pellet Plant',          areaCode: 'PL', color: '#22c55e', material: 'Pellets',    description: 'Pellets to stockyard/BF' },

  // ── Slag Handling ──────────────────────────────────────────────────────────
  { id: 'SLAG-HAND-01',   name: 'Slag Belt 1',           area: 'Slag Handling',         areaCode: 'SL', color: '#a855f7', material: 'Slag',       description: 'Primary slag handling' },
  { id: 'SLAG-HAND-02',   name: 'Slag Belt 2',           area: 'Slag Handling',         areaCode: 'SL', color: '#a855f7', material: 'Slag',       description: 'Secondary slag handling' },
  { id: 'SLAG-HOT-01',    name: 'Hot Slag Belt',         area: 'Slag Handling',         areaCode: 'SL', color: '#a855f7', material: 'Hot Slag',   description: 'High-temp slag conveyor' },
  { id: 'SLAG-DISP-01',   name: 'Slag Disposal Belt',    area: 'Slag Handling',         areaCode: 'SL', color: '#a855f7', material: 'Slag',       description: 'Slag to disposal yard' },

  // ── Finished Material / Rolling Mill ──────────────────────────────────────
  { id: 'RM-BILLET-01',   name: 'Billet Transfer Belt',  area: 'Finished Material / Rolling Mill', areaCode: 'FM', color: '#f59e0b', material: 'Billet',  description: 'Billet to rolling mill' },
  { id: 'RM-SLAB-01',     name: 'Slab Transfer Belt',    area: 'Finished Material / Rolling Mill', areaCode: 'FM', color: '#f59e0b', material: 'Slab',    description: 'Slab transfer conveyor' },
  { id: 'RM-FINPROD-01',  name: 'Finished Product Belt', area: 'Finished Material / Rolling Mill', areaCode: 'FM', color: '#f59e0b', material: 'Product', description: 'Finished goods to yard' },
  { id: 'RM-COOLBED-01',  name: 'Cooling Bed Conveyor',  area: 'Finished Material / Rolling Mill', areaCode: 'FM', color: '#f59e0b', material: 'Hot Product','description': 'Cooling bed exit conveyor' },

  // ── Yard & Dispatch ────────────────────────────────────────────────────────
  { id: 'YARD-CONV-01',   name: 'Yard Conveyor 1',       area: 'Yard & Dispatch',       areaCode: 'YD', color: '#06b6d4', material: 'Mixed',      description: 'Yard primary conveyor' },
  { id: 'YARD-CONV-02',   name: 'Yard Conveyor 2',       area: 'Yard & Dispatch',       areaCode: 'YD', color: '#06b6d4', material: 'Mixed',      description: 'Yard secondary conveyor' },
  { id: 'YARD-STACK-01',  name: 'Stacker Belt',          area: 'Yard & Dispatch',       areaCode: 'YD', color: '#06b6d4', material: 'Mixed',      description: 'Stacker/reclaimer feed' },
  { id: 'YARD-RECLM-01',  name: 'Reclaimer Belt',        area: 'Yard & Dispatch',       areaCode: 'YD', color: '#06b6d4', material: 'Mixed',      description: 'Reclaimer discharge' },
  { id: 'YARD-WAGON-01',  name: 'Wagon Loading Belt',    area: 'Yard & Dispatch',       areaCode: 'YD', color: '#06b6d4', material: 'Mixed',      description: 'Rail wagon loading' },

  // ── Special Purpose ────────────────────────────────────────────────────────
  { id: 'SP-INCLINE-01',  name: 'Inclined Belt 1',       area: 'Special Purpose',       areaCode: 'SP2',color: '#64748b', material: 'Mixed',      description: 'Inclined conveyor +15°' },
  { id: 'SP-DECLINE-01',  name: 'Decline Belt 1',        area: 'Special Purpose',       areaCode: 'SP2',color: '#64748b', material: 'Mixed',      description: 'Decline conveyor -12°' },
  { id: 'SP-XFER-01',     name: 'Cross Transfer Belt',   area: 'Special Purpose',       areaCode: 'SP2',color: '#64748b', material: 'Mixed',      description: 'Cross-plant transfer' },
  { id: 'SP-BYPASS-01',   name: 'Emergency Bypass Belt', area: 'Special Purpose',       areaCode: 'SP2',color: '#64748b', material: 'Mixed',      description: 'Emergency bypass route' },
];

/** Group belts by area */
export function getBeltsByArea(): Record<string, BeltEntry[]> {
  return BELT_CATALOG.reduce<Record<string, BeltEntry[]>>((acc, belt) => {
    if (!acc[belt.area]) acc[belt.area] = [];
    acc[belt.area].push(belt);
    return acc;
  }, {});
}

/** Find a belt by ID */
export function getBeltById(id: string): BeltEntry | undefined {
  return BELT_CATALOG.find((b) => b.id === id);
}
