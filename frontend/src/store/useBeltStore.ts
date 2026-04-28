import { create } from 'zustand';
import type { BeltConfig, Alert, SensorReading, MLPrediction } from '@/types';
import type { BeltEntry } from '@/data/beltCatalog';
import { BELT_CATALOG } from '@/data/beltCatalog';

type Theme = 'dark' | 'light';

export type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'cyan';
export type FontSize    = 'compact' | 'default' | 'large';
export type BorderRadius = 'sharp' | 'default' | 'rounded';

export interface UISettings {
  zoom:         number;       // 60–130, applied as CSS zoom on #root
  fontSize:     FontSize;
  accentColor:  AccentColor;
  borderRadius: BorderRadius;
  compactMode:  boolean;      // tighter padding everywhere
  sidebarLabels: boolean;     // show/hide text labels in sidebar (independent of collapse)
}

const ACCENT_COLORS: Record<AccentColor, string> = {
  green:  '#27a372',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  red:    '#ef4444',
  cyan:   '#06b6d4',
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  compact: '13px',
  default: '14px',
  large:   '16px',
};

const BORDER_RADIUS_MAP: Record<BorderRadius, string> = {
  sharp:   '4px',
  default: '12px',
  rounded: '20px',
};

function getInitialUISettings(): UISettings {
  try {
    const raw = localStorage.getItem('beltguard-ui-settings');
    if (raw) return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_UI_SETTINGS;
}

const DEFAULT_UI_SETTINGS: UISettings = {
  zoom:         90,
  fontSize:     'default',
  accentColor:  'green',
  borderRadius: 'default',
  compactMode:  false,
  sidebarLabels: true,
};

function applyUISettings(s: UISettings) {
  const root = document.documentElement;
  // Zoom — applied to the root element
  (document.getElementById('root') as HTMLElement | null)?.style.setProperty('zoom', `${s.zoom}%`);
  // Font size
  root.style.setProperty('--font-size-base', FONT_SIZE_MAP[s.fontSize]);
  // Accent color
  const accent = ACCENT_COLORS[s.accentColor];
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-brand', accent);
  // Border radius
  root.style.setProperty('--radius-card', BORDER_RADIUS_MAP[s.borderRadius]);
  // Compact mode
  root.style.setProperty('--spacing-card', s.compactMode ? '0.5rem' : '1rem');
  try { localStorage.setItem('beltguard-ui-settings', JSON.stringify(s)); } catch {}
}

interface BeltStore {
  activeBelt: BeltConfig | null;
  setActiveBelt: (belt: BeltConfig) => void;

  selectedBeltEntry: BeltEntry;
  setSelectedBeltEntry: (entry: BeltEntry) => void;

  sensorHistory: SensorReading[];
  pushSensorReading: (r: SensorReading) => void;

  latestPrediction: MLPrediction | null;
  setLatestPrediction: (p: MLPrediction) => void;

  alerts: Alert[];
  addAlert: (a: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  clearAcknowledged: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;

  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  plcBeltRunning: boolean;
  plcStopReason: string | null;
  setPLCRunning: (running: boolean, reason?: string) => void;

  // ── UI Settings ───────────────────────────────────────────────────────────
  uiSettings: UISettings;
  setUISettings: (patch: Partial<UISettings>) => void;
  resetUISettings: () => void;
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
  return BELT_CATALOG[0];
}

// Apply on load
applyTheme(getInitialTheme());
applyUISettings(getInitialUISettings());

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
    set((state) => ({ sensorHistory: [...state.sensorHistory.slice(-59), r] })),

  latestPrediction: null,
  setLatestPrediction: (p) => set({ latestPrediction: p }),

  alerts: [],
  addAlert: (a) =>
    set((state) => ({ alerts: [a, ...state.alerts].slice(0, 200) })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => a.id === id ? { ...a, acknowledged: true } : a),
    })),
  clearAcknowledged: () =>
    set((state) => ({ alerts: state.alerts.filter((a) => !a.acknowledged) })),

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
    set(() => { applyTheme(t); return { theme: t }; }),

  plcBeltRunning: true,
  plcStopReason: null,
  setPLCRunning: (running, reason) =>
    set({ plcBeltRunning: running, plcStopReason: running ? null : (reason ?? 'Manual stop') }),

  uiSettings: getInitialUISettings(),
  setUISettings: (patch) =>
    set((s) => {
      const next = { ...s.uiSettings, ...patch };
      applyUISettings(next);
      return { uiSettings: next };
    }),
  resetUISettings: () =>
    set(() => {
      applyUISettings(DEFAULT_UI_SETTINGS);
      return { uiSettings: DEFAULT_UI_SETTINGS };
    }),
}));

export { ACCENT_COLORS, DEFAULT_UI_SETTINGS };
