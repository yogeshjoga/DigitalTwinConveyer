import { useState } from 'react';
import { useBeltConfigs, useCreateBelt, useUpdateBelt } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import type { BeltConfig } from '@/types';

const MATERIAL_TYPES = ['Rubber', 'Steel Cord', 'Fabric', 'PVC', 'Polyurethane'];

const defaultForm: Omit<BeltConfig, 'id' | 'createdAt'> = {
  name: '', width: 1200, thickness: 20, length: 50, speed: 2.5,
  materialType: 'Rubber', tensileStrength: 800, hardness: 65, elasticModulus: 0.05,
};

export default function BeltConfigPage() {
  const { data: belts }               = useBeltConfigs();
  const { mutate: createBelt }        = useCreateBelt();
  const { mutate: updateBelt }        = useUpdateBelt();
  const { activeBelt, setActiveBelt } = useBeltStore();

  const [form, setForm]       = useState(defaultForm);
  const [editing, setEditing] = useState<string | null>(null);

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
        <p className="text-secondary text-sm mt-1">Define belt properties and material specifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary mb-4">{editing ? 'Edit Belt' : 'Add New Belt'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name', 'Belt Name', 'text')}
            <div className="grid grid-cols-2 gap-4">
              {field('width', 'Width', 'number', 'mm', 200, 3000)}
              {field('thickness', 'Thickness', 'number', 'mm', 5, 50)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('length', 'Length', 'number', 'm', 5, 500)}
              {field('speed', 'Speed', 'number', 'm/s', 1, 6)}
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

        {/* Belt list */}
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary mb-4">Configured Belts</h2>
          {!belts?.length ? (
            <p className="text-muted text-sm">No belts configured yet.</p>
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
                        aria-label="Set as active belt" title="Set as active">
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
      </div>
    </div>
  );
}
