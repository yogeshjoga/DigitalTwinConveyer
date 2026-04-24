import { create } from 'zustand';
import type { BeltConfig, Alert, SensorReading, MLPrediction } from '@/types';
import type { BeltEntry } from '@/data/beltCatalog';
import { BELT_CATALOG } from '@/data/beltCatalog';

type Theme = 'dark' | 'light';

interface BeltStore {
  // Active belt config (from backend CRUD)
  activeBelt: BeltConfig | null;
  setActiveBelt: (belt: BeltConfig) => void;

  // Selected belt from the steel-industry catalog
  selectedBeltEntry: BeltEntry;
  setSelectedBeltEntry: (entry: BeltEntry) => void;

  // Live sensor data (ring buffer, last 60 readings)
  sensorHistory: SensorReading[];
  pushSensorReading: (r: SensorReading) => void;

  // Latest ML prediction
  latestPrediction: MLPrediction | null;
  setLatestPrediction: (p: MLPrediction) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (a: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  clearAcknowledged: () => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('beltguard-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  try { localStorage.setItem('beltguard-theme', theme); } catch {}
}

function getInitialBeltEntry(): BeltEntry {
  try {
    const stored = localStorage.getItem('beltguard-selected-belt');
    if (stored) {
      const found = BELT_CATALOG.find((b) => b.id === stored);
      if (found) return found;
    }
  } catch {}
  return BELT_CATALOG[0]; // default: Iron Ore Belt 1
}

applyTheme(getInitialTheme());

export const useBeltStore = create<BeltStore>((set) => ({
  activeBelt: null,
  setActiveBelt: (belt) => set({ activeBelt: belt }),

  selectedBeltEntry: getInitialBeltEntry(),
  setSelectedBeltEntry: (entry) => {
    try { localStorage.setItem('beltguard-selected-belt', entry.id); } catch {}
    set({ selectedBeltEntry: entry });
  },

  sensorHistory: [],
  pushSensorReading: (r) =>
    set((state) => ({
      sensorHistory: [...state.sensorHistory.slice(-59), r],
    })),

  latestPrediction: null,
  setLatestPrediction: (p) => set({ latestPrediction: p }),

  alerts: [],
  addAlert: (a) =>
    set((state) => ({ alerts: [a, ...state.alerts].slice(0, 200) })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),
  clearAcknowledged: () =>
    set((state) => ({
      alerts: state.alerts.filter((a) => !a.acknowledged),
    })),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  theme: getInitialTheme(),
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    }),
  setTheme: (t) =>
    set(() => {
      applyTheme(t);
      return { theme: t };
    }),
}));
