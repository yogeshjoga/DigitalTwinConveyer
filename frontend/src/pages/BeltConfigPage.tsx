import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBeltConfigs, useCreateBelt, useUpdateBelt } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import { toast } from 'react-toastify';
import {
  Check, ChevronDown, Zap, Thermometer, Shield, AlertTriangle,
  Package, TrendingUp, Info, X,
} from 'lucide-react';
import type { BeltConfig } from '@/types';

// ── Belt preset library ───────────────────────────────────────────────────────
interface BeltPreset {
  id: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
  // Form fields
  width: number;
  thickness: number;
  length: number;
  speed: number;
  materialType: string;
  tensileStrength: number;
  hardness: number;
  elasticModulus: number;
  // Extra info (display only)
  beltType: string;
  standard: string;
  udlRange: string;
  pointLoadRange: string;
  tempRange: string;
  safetyFactor: string;
  bestFor: string[];
  notFor: string[];
  color: string;
  tags: string[];
}

const BELT_PRESETS: BeltPreset[] = [
  {
    id: 'ep-mining',
    name: 'EP Mining Belt',
    category: 'Heavy Bulk',
    icon: '⛏️',
    tagline: 'High-strength polyester-nylon for coal, iron ore, and heavy mining',
    beltType: 'Troughed Belt (EP)',
    standard: 'ISO 22721 / CEMA',
    width: 1200, thickness: 22, length: 100, speed: 3.0,
    materialType: 'Rubber',
    tensileStrength: 1000, hardness: 65, elasticModulus: 0.08,
    udlRange: '500–2000 kg/m',
    pointLoadRange: '100–500 kg',
    tempRange: '-20°C to 80°C',
    safetyFactor: '6–8',
    bestFor: ['Coal handling', 'Iron ore', 'Limestone', 'Copper ore', 'Aggregate'],
    notFor: ['Food processing', 'High-temp (>80°C)', 'Chemical exposure'],
    color: '#78716c',
    tags: ['Mining', 'Bulk', 'Heavy Duty'],
  },
  {
    id: 'steel-cord-long',
    name: 'Steel Cord Long-Distance',
    category: 'Ultra Heavy',
    icon: '🔩',
    tagline: 'Steel wire reinforced for long-distance, high-tension applications',
    beltType: 'Steel Cord Belt',
    standard: 'ISO 15236 / DIN 22131',
    width: 1600, thickness: 28, length: 500, speed: 4.5,
    materialType: 'Steel Cord',
    tensileStrength: 3150, hardness: 60, elasticModulus: 2.5,
    udlRange: '1000–5000+ kg/m',
    pointLoadRange: '500–2000 kg',
    tempRange: '-20°C to 80°C',
    safetyFactor: '5–7',
    bestFor: ['Long-distance (>500m)', 'High-capacity mining', 'Port bulk handling', 'Overland conveyors'],
    notFor: ['Short runs (<100m)', 'Tight curves', 'Food/pharma'],
    color: '#64748b',
    tags: ['Steel Cord', 'Long Distance', 'Ultra Heavy'],
  },
  {
    id: 'heat-resistant',
    name: 'Heat Resistant Rubber',
    category: 'High Temperature',
    icon: '🌡️',
    tagline: 'Specially compounded rubber for hot sinter, clinker, and slag',
    beltType: 'Troughed Belt (HR)',
    standard: 'ISO 4195 / DIN 22102-T',
    width: 1000, thickness: 24, length: 80, speed: 1.5,
    materialType: 'Rubber',
    tensileStrength: 800, hardness: 70, elasticModulus: 0.12,
    udlRange: '300–1500 kg/m',
    pointLoadRange: '50–300 kg',
    tempRange: 'Up to 200°C (T3 grade)',
    safetyFactor: '7–9',
    bestFor: ['Hot sinter', 'Clinker', 'Slag', 'Cement kiln discharge', 'Foundry'],
    notFor: ['Cold/ambient only', 'Chemical exposure', 'Food processing'],
    color: '#ef4444',
    tags: ['Heat Resistant', 'Sinter', 'Cement'],
  },
  {
    id: 'fire-resistant',
    name: 'Fire Resistant (FRAS)',
    category: 'Safety Critical',
    icon: '🔥',
    tagline: 'Anti-static, flame-resistant for underground mining (MSHA/AS4606)',
    beltType: 'Flat / Troughed (FRAS)',
    standard: 'AS 4606 / MSHA / EN ISO 340',
    width: 1000, thickness: 20, length: 200, speed: 2.5,
    materialType: 'Rubber',
    tensileStrength: 630, hardness: 62, elasticModulus: 0.07,
    udlRange: '200–800 kg/m',
    pointLoadRange: '50–200 kg',
    tempRange: '-20°C to 60°C',
    safetyFactor: '8–10',
    bestFor: ['Underground coal mines', 'Tunnels', 'Explosive atmosphere zones', 'ATEX areas'],
    notFor: ['Surface conveyors (overkill)', 'High-temp applications'],
    color: '#f97316',
    tags: ['FRAS', 'Underground', 'Safety'],
  },
  {
    id: 'pvc-light',
    name: 'PVC Light Industry',
    category: 'Light Duty',
    icon: '📦',
    tagline: 'Low-cost PVC for packaging, logistics, and light manufacturing',
    beltType: 'Flat Belt (PVC)',
    standard: 'ISO 22721',
    width: 600, thickness: 8, length: 30, speed: 1.5,
    materialType: 'PVC',
    tensileStrength: 250, hardness: 75, elasticModulus: 0.03,
    udlRange: '50–200 kg/m',
    pointLoadRange: '5–50 kg',
    tempRange: '-10°C to 60°C',
    safetyFactor: '6–8',
    bestFor: ['Packaging lines', 'Logistics/warehouses', 'Light assembly', 'Parcel sorting'],
    notFor: ['Heavy bulk', 'High temp', 'Outdoor UV exposure', 'Chemical solvents'],
    color: '#3b82f6',
    tags: ['PVC', 'Light Duty', 'Logistics'],
  },
  {
    id: 'pu-food',
    name: 'PU Food Grade',
    category: 'Food & Pharma',
    icon: '🍎',
    tagline: 'FDA-compliant polyurethane for food, beverage, and pharmaceutical',
    beltType: 'Flat Belt (PU)',
    standard: 'FDA 21 CFR / EU 10/2011',
    width: 500, thickness: 6, length: 20, speed: 1.0,
    materialType: 'Polyurethane',
    tensileStrength: 180, hardness: 80, elasticModulus: 0.025,
    udlRange: '20–150 kg/m',
    pointLoadRange: '2–30 kg',
    tempRange: '-40°C to 80°C',
    safetyFactor: '6–8',
    bestFor: ['Food processing', 'Beverage bottling', 'Pharmaceutical', 'Bakery', 'Meat processing'],
    notFor: ['Heavy bulk', 'Abrasive materials', 'High-temp (>80°C)'],
    color: '#22c55e',
    tags: ['Food Grade', 'FDA', 'PU'],
  },
  {
    id: 'cleated-incline',
    name: 'Cleated Incline Belt',
    category: 'Inclined Transport',
    icon: '📐',
    tagline: 'Vertical cleats prevent rollback on steep inclines up to 45°',
    beltType: 'Cleated Belt',
    standard: 'ISO 22721',
    width: 800, thickness: 14, length: 40, speed: 1.2,
    materialType: 'Rubber',
    tensileStrength: 400, hardness: 65, elasticModulus: 0.05,
    udlRange: '100–500 kg/m',
    pointLoadRange: '20–150 kg',
    tempRange: '-20°C to 70°C',
    safetyFactor: '7–9',
    bestFor: ['Steep inclines (15°–45°)', 'Grain elevators', 'Aggregate', 'Recycling plants'],
    notFor: ['Flat conveyors', 'Fine powder (cleat gaps)', 'High-speed (>2 m/s)'],
    color: '#a855f7',
    tags: ['Cleated', 'Incline', 'Anti-rollback'],
  },
  {
    id: 'sidewall-steep',
    name: 'Sidewall Steep Angle',
    category: 'Vertical Conveying',
    icon: '🏗️',
    tagline: 'Corrugated sidewalls for near-vertical conveying in tight spaces',
    beltType: 'Sidewall Belt',
    standard: 'DIN 22112',
    width: 500, thickness: 12, length: 25, speed: 0.8,
    materialType: 'Rubber',
    tensileStrength: 315, hardness: 60, elasticModulus: 0.04,
    udlRange: '80–400 kg/m',
    pointLoadRange: '10–100 kg',
    tempRange: '-20°C to 70°C',
    safetyFactor: '7–9',
    bestFor: ['Vertical/steep conveying', 'Space-constrained plants', 'Grain', 'Fertilizer', 'Chips'],
    notFor: ['Flat runs', 'Very heavy lumps', 'High-speed'],
    color: '#06b6d4',
    tags: ['Sidewall', 'Steep Angle', 'Vertical'],
  },
  {
    id: 'ep-sinter',
    name: 'EP Sinter Plant Belt',
    category: 'Steel Plant',
    icon: '🏭',
    tagline: 'Reinforced EP belt for sinter feed, return fines, and burden',
    beltType: 'Troughed Belt (EP)',
    standard: 'ISO 22721 / IS 1891',
    width: 1400, thickness: 26, length: 120, speed: 2.0,
    materialType: 'Rubber',
    tensileStrength: 1250, hardness: 68, elasticModulus: 0.10,
    udlRange: '600–2500 kg/m',
    pointLoadRange: '200–800 kg',
    tempRange: '-20°C to 80°C (HR grade for hot sinter)',
    safetyFactor: '6–8',
    bestFor: ['Sinter feed', 'Return fines', 'BF burden', 'Iron ore', 'Coke'],
    notFor: ['Food/pharma', 'Chemical exposure', 'Very long distance (use steel cord)'],
    color: '#f59e0b',
    tags: ['Steel Plant', 'Sinter', 'EP'],
  },
];

const MATERIAL_TYPES = ['Rubber', 'Steel Cord', 'Fabric', 'PVC', 'Polyurethane', 'Heat Resistant Rubber', 'FRAS Rubber'];

const defaultForm: Omit<BeltConfig, 'id' | 'createdAt'> = {
  name: '', width: 1200, thickness: 20, length: 50, speed: 2.5,
  materialType: 'Rubber', tensileStrength: 800, hardness: 65, elasticModulus: 0.05,
};

// ── Preset Dropdown ───────────────────────────────────────────────────────────
function PresetDropdown({ onSelect }: { onSelect: (p: BeltPreset) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BeltPreset | null>(null);
  const [detail, setDetail] = useState<BeltPreset | null>(null);

  const categories = [...new Set(BELT_PRESETS.map((p) => p.category))];

  const handleSelect = (p: BeltPreset) => {
    setSelected(p);
    setOpen(false);
    onSelect(p);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package size={15} className="text-secondary" />
        <span className="text-sm font-bold text-primary">Load from Preset</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: '#27a37218', color: '#27a372', border: '1px solid #27a37233' }}>
          {BELT_PRESETS.length} presets
        </span>
      </div>

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: `1.5px solid ${selected ? selected.color + '88' : 'var(--color-border)'}`,
            color: 'var(--text-primary)',
          }}
        >
          {selected ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{selected.icon}</span>
              <div className="min-w-0">
                <span className="font-semibold truncate">{selected.name}</span>
                <span className="text-xs text-muted ml-2">{selected.category}</span>
              </div>
            </div>
          ) : (
            <span className="text-muted">Select a belt type preset…</span>
          )}
          <ChevronDown size={15} className="text-muted flex-shrink-0 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)', maxHeight: 420, overflowY: 'auto' }}
            >
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted select-none">
                    {cat}
                  </p>
                  {BELT_PRESETS.filter((p) => p.category === cat).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelect(preset)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <span className="text-xl flex-shrink-0">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{preset.name}</span>
                          {preset.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: preset.color + '18', color: preset.color }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted truncate">{preset.tagline}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDetail(preset); setOpen(false); }}
                        className="p-1 rounded-lg text-muted hover:text-primary transition-colors flex-shrink-0"
                        title="View details"
                      >
                        <Info size={13} />
                      </button>
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected preset summary */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3 space-y-2"
          style={{ backgroundColor: selected.color + '0d', border: `1px solid ${selected.color}33` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selected.icon}</span>
              <div>
                <p className="text-xs font-bold text-primary">{selected.name}</p>
                <p className="text-[10px] text-muted">{selected.beltType} · {selected.standard}</p>
              </div>
            </div>
            <button type="button" onClick={() => setDetail(selected)}
              className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
              style={{ background: selected.color + '18', color: selected.color, border: `1px solid ${selected.color}33` }}>
              Full Specs
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {[
              { label: 'UDL Range', value: selected.udlRange },
              { label: 'Point Load', value: selected.pointLoadRange },
              { label: 'Temp Range', value: selected.tempRange },
              { label: 'Safety Factor', value: selected.safetyFactor },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg px-2 py-1.5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <span className="text-muted">{label}: </span>
                <span className="font-semibold text-primary">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {selected.bestFor.slice(0, 4).map((u) => (
              <span key={u} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: '#22c55e18', color: '#22c55e' }}>
                ✓ {u}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: 'var(--color-panel)', border: `1.5px solid ${detail.color}44` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b"
                style={{ borderColor: 'var(--color-border)', background: detail.color + '0d' }}>
                <span className="text-3xl">{detail.icon}</span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-primary">{detail.name}</h3>
                  <p className="text-xs text-muted">{detail.beltType} · {detail.standard}</p>
                </div>
                <button onClick={() => setDetail(null)} className="p-2 rounded-lg text-muted hover:text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-secondary">{detail.tagline}</p>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: TrendingUp, label: 'UDL Range',      value: detail.udlRange },
                    { icon: Zap,        label: 'Point Load',     value: detail.pointLoadRange },
                    { icon: Thermometer,label: 'Temp Range',     value: detail.tempRange },
                    { icon: Shield,     label: 'Safety Factor',  value: detail.safetyFactor },
                    { icon: Package,    label: 'Tensile Strength',value: `${detail.tensileStrength} N/mm²` },
                    { icon: Info,       label: 'Hardness',       value: `${detail.hardness} Shore A` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon size={11} style={{ color: detail.color }} />
                        <span className="text-[10px] text-muted">{label}</span>
                      </div>
                      <p className="text-sm font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Default dimensions */}
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Default Dimensions</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Width', value: `${detail.width} mm` },
                      { label: 'Thickness', value: `${detail.thickness} mm` },
                      { label: 'Length', value: `${detail.length} m` },
                      { label: 'Speed', value: `${detail.speed} m/s` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] text-muted">{label}</p>
                        <p className="text-xs font-bold text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best for / Not for */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 space-y-1.5"
                    style={{ backgroundColor: '#22c55e08', border: '1px solid #22c55e33' }}>
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">✓ Best For</p>
                    {detail.bestFor.map((u) => (
                      <p key={u} className="text-[11px] text-secondary">• {u}</p>
                    ))}
                  </div>
                  <div className="rounded-xl p-3 space-y-1.5"
                    style={{ backgroundColor: '#ef444408', border: '1px solid #ef444433' }}>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">✗ Not For</p>
                    {detail.notFor.map((u) => (
                      <p key={u} className="text-[11px] text-secondary">• {u}</p>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { handleSelect(detail); setDetail(null); }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${detail.color}, ${detail.color}cc)` }}
                >
                  Load This Preset → Fill Form
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BeltConfigPage() {
  const { data: belts }               = useBeltConfigs();
  const { mutate: createBelt }        = useCreateBelt();
  const { mutate: updateBelt }        = useUpdateBelt();
  const { activeBelt, setActiveBelt } = useBeltStore();

  const [form, setForm]       = useState(defaultForm);
  const [editing, setEditing] = useState<string | null>(null);

  const handlePresetSelect = (p: BeltPreset) => {
    setForm({
      name: p.name,
      width: p.width,
      thickness: p.thickness,
      length: p.length,
      speed: p.speed,
      materialType: p.materialType,
      tensileStrength: p.tensileStrength,
      hardness: p.hardness,
      elasticModulus: p.elasticModulus,
    });
    setEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateBelt({ id: editing, ...form }, { onSuccess: () => { toast.success('Belt updated'); setEditing(null); } });
    } else {
      createBelt(form, { onSuccess: () => { toast.success('Belt created'); setForm(defaultForm); } });
    }
  };

  const startEdit = (belt: BeltConfig) => {
    setEditing(belt.id);
    setForm({ name: belt.name, width: belt.width, thickness: belt.thickness, length: belt.length,
      speed: belt.speed, materialType: belt.materialType, tensileStrength: belt.tensileStrength,
      hardness: belt.hardness, elasticModulus: belt.elasticModulus });
  };

  const field = (key: keyof typeof form, label: string, type: 'text' | 'number' = 'number', unit?: string, min?: number, max?: number) => (
    <div>
      <label className="block text-xs text-muted mb-1">
        {label} {unit && <span className="text-muted opacity-70">({unit})</span>}
      </label>
      <input
        type={type}
        value={form[key] as string | number}
        min={min} max={max}
        step={type === 'number' ? 'any' : undefined}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
        className="input"
        required
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Belt Configuration</h1>
        <p className="text-secondary text-sm mt-1">
          Define belt properties — load from an industry preset or configure manually
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-secondary">{editing ? 'Edit Belt' : 'Add New Belt'}</h2>

          {/* Preset dropdown — only show when creating */}
          {!editing && <PresetDropdown onSelect={handlePresetSelect} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name', 'Belt Name', 'text')}
            <div className="grid grid-cols-2 gap-4">
              {field('width', 'Width', 'number', 'mm', 200, 3000)}
              {field('thickness', 'Thickness', 'number', 'mm', 5, 50)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('length', 'Length', 'number', 'm', 5, 500)}
              {field('speed', 'Speed', 'number', 'm/s', 0.5, 6)}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Material Type</label>
              <select
                value={form.materialType}
                onChange={(e) => setForm((f) => ({ ...f, materialType: e.target.value }))}
                className="input"
              >
                {MATERIAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('tensileStrength', 'Tensile Strength', 'number', 'N/mm²', 100, 5000)}
              {field('hardness', 'Hardness', 'number', 'Shore A', 30, 100)}
            </div>
            {field('elasticModulus', 'Elastic Modulus', 'number', 'GPa', 0.01, 10)}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                {editing ? 'Update Belt' : 'Create Belt'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(defaultForm); }}
                  className="px-4 rounded-lg py-2 text-sm transition-colors text-secondary hover:text-primary border"
                  style={{ borderColor: 'var(--color-border)' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Belt list + preset reference */}
        <div className="space-y-4">
          {/* Configured belts */}
          <div className="card">
            <h2 className="text-sm font-semibold text-secondary mb-4">Configured Belts</h2>
            {!belts?.length ? (
              <p className="text-muted text-sm">No belts configured yet. Load a preset to get started.</p>
            ) : (
              <ul className="space-y-2">
                {belts.map((belt) => (
                  <li key={belt.id} className={`p-3 rounded-lg border transition-colors ${
                    activeBelt?.id === belt.id ? 'border-brand-500/50 bg-brand-500/10' : ''
                  }`} style={{ borderColor: activeBelt?.id === belt.id ? undefined : 'var(--color-border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">{belt.name}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {belt.width}mm × {belt.length}m · {belt.materialType} · {belt.speed}m/s
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setActiveBelt(belt)}
                          className={`p-1.5 rounded-lg transition-colors ${activeBelt?.id === belt.id ? 'text-brand-500' : 'text-muted hover:text-primary'}`}
                          title="Set as active belt">
                          <Check size={14} />
                        </button>
                        <button onClick={() => startEdit(belt)}
                          className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: 'var(--color-border)' }}>
                          Edit
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick reference card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wide">Quick Selection Guide</h3>
            </div>
            <div className="space-y-1.5">
              {[
                { use: 'Coal / Iron Ore / Mining',    belt: 'EP Mining Belt',          color: '#78716c' },
                { use: 'Long Distance (>500m)',        belt: 'Steel Cord',              color: '#64748b' },
                { use: 'Hot Sinter / Clinker / Slag',  belt: 'Heat Resistant Rubber',   color: '#ef4444' },
                { use: 'Underground Mine',             belt: 'FRAS Fire Resistant',     color: '#f97316' },
                { use: 'Food / Pharma',                belt: 'PU Food Grade',           color: '#22c55e' },
                { use: 'Packaging / Logistics',        belt: 'PVC Light Industry',      color: '#3b82f6' },
                { use: 'Steep Incline (>15°)',         belt: 'Cleated Incline Belt',    color: '#a855f7' },
                { use: 'Vertical / Tight Space',       belt: 'Sidewall Steep Angle',    color: '#06b6d4' },
                { use: 'Steel Plant (Sinter/BF)',      belt: 'EP Sinter Plant Belt',    color: '#f59e0b' },
              ].map(({ use, belt, color }) => (
                <div key={use} className="flex items-center justify-between text-[11px] py-1 border-b last:border-0"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-secondary">{use}</span>
                  <span className="font-semibold px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: color + '18', color }}>
                    {belt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
