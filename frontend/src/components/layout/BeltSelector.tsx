import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBeltStore } from '@/store/useBeltStore';
import { BELT_CATALOG, getBeltsByArea, AREA_COLORS, type BeltEntry } from '@/data/beltCatalog';

export default function BeltSelector() {
  const { selectedBeltEntry, setSelectedBeltEntry } = useBeltStore();
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef         = useRef<HTMLDivElement>(null);
  const searchRef           = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  const filtered = search.trim()
    ? BELT_CATALOG.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.id.toLowerCase().includes(search.toLowerCase()) ||
          b.material.toLowerCase().includes(search.toLowerCase()) ||
          b.area.toLowerCase().includes(search.toLowerCase())
      )
    : null; // null = show grouped

  const grouped = getBeltsByArea();

  const select = (entry: BeltEntry) => {
    setSelectedBeltEntry(entry);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm font-medium max-w-[280px]"
        style={{
          backgroundColor: open ? selectedBeltEntry.color + '18' : 'var(--color-surface)',
          borderColor: open ? selectedBeltEntry.color + '66' : 'var(--color-border)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Area color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedBeltEntry.color }}
        />

        {/* Belt info */}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="truncate leading-tight text-xs font-bold" style={{ color: selectedBeltEntry.color }}>
            {selectedBeltEntry.id}
          </span>
          <span className="truncate leading-tight text-xs text-secondary">
            {selectedBeltEntry.name}
          </span>
        </div>

        <ChevronDown
          size={14}
          className="flex-shrink-0 text-muted transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[200] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              width: 380,
              maxHeight: 520,
              backgroundColor: 'var(--color-panel)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Search size={14} className="text-muted flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search belt name, ID, material…"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="text-[10px] text-muted">{BELT_CATALOG.length} belts</span>
            </div>

            {/* Belt list */}
            <div className="overflow-y-auto flex-1">
              {filtered ? (
                // Search results — flat list
                filtered.length === 0 ? (
                  <div className="py-8 text-center text-muted text-sm">No belts match "{search}"</div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {filtered.map((belt) => (
                      <BeltRow
                        key={belt.id}
                        belt={belt}
                        isActive={belt.id === selectedBeltEntry.id}
                        onSelect={select}
                      />
                    ))}
                  </div>
                )
              ) : (
                // Grouped by area
                Object.entries(grouped).map(([area, belts]) => (
                  <div key={area}>
                    {/* Area header */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10"
                      style={{ backgroundColor: 'var(--color-panel)' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: AREA_COLORS[area as keyof typeof AREA_COLORS] ?? '#64748b' }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                        {area}
                      </span>
                      <span className="text-[10px] text-muted ml-auto">{belts.length}</span>
                    </div>

                    {/* Belt rows */}
                    <div className="px-2 pb-1 space-y-0.5">
                      {belts.map((belt) => (
                        <BeltRow
                          key={belt.id}
                          belt={belt}
                          isActive={belt.id === selectedBeltEntry.id}
                          onSelect={select}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="px-3 py-2 border-t flex-shrink-0 flex items-center justify-between"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="text-[10px] text-muted">
                Selected: <strong style={{ color: selectedBeltEntry.color }}>{selectedBeltEntry.id}</strong>
              </span>
              <span className="text-[10px] text-muted">
                {selectedBeltEntry.area}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BeltRow({
  belt,
  isActive,
  onSelect,
}: {
  belt: BeltEntry;
  isActive: boolean;
  onSelect: (b: BeltEntry) => void;
}) {
  return (
    <button
      onClick={() => onSelect(belt)}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all group"
      style={{
        backgroundColor: isActive ? belt.color + '18' : 'transparent',
        border: `1px solid ${isActive ? belt.color + '44' : 'transparent'}`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Color dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: belt.color }}
      />

      {/* ID badge */}
      <span
        className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ background: belt.color + '22', color: belt.color }}
      >
        {belt.id}
      </span>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary truncate">{belt.name}</p>
        <p className="text-[10px] text-muted truncate">{belt.description}</p>
      </div>

      {/* Active check */}
      {isActive && (
        <CheckCircle2 size={14} style={{ color: belt.color }} className="flex-shrink-0" />
      )}
    </button>
  );
}
