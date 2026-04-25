/**
 * MinistryHeader — Official Indian Ministry of Steel branding banner.
 * Features a tricolour flag-shaded background and show/hide toggle.
 */
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';

interface MinistryHeaderProps {
  visible: boolean;
  onToggle: () => void;
}

export default function MinistryHeader({ visible, onToggle }: MinistryHeaderProps) {
  return (
    <div className="relative">
      {/* ── Toggle pill — always visible ── */}
      <div className="flex justify-end mb-1">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
          style={{
            background: visible
              ? 'linear-gradient(90deg,#FF993322,#ffffff22,#13880822)'
              : 'var(--color-surface)',
            border: '1px solid',
            borderColor: visible ? '#FF993366' : 'var(--color-border)',
            color: visible ? '#cc5500' : 'var(--text-muted)',
          }}
        >
          {visible ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {visible ? 'Hide Ministry Banner' : '🇮🇳 Show Ministry Banner'}
        </button>
      </div>

      {/* ── Banner ── */}
      {visible && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            /* Tricolour outer border */
            background: 'linear-gradient(180deg, #FF9933 0%, #FF9933 33.3%, #ffffff 33.3%, #ffffff 66.6%, #138808 66.6%, #138808 100%)',
            padding: '3px',
            boxShadow: '0 4px 24px rgba(255,153,51,0.18), 0 2px 8px rgba(19,136,8,0.12)',
          }}
        >
          {/* Inner panel with flag-tinted background */}
          <div
            className="rounded-[13px] relative overflow-hidden"
            style={{
              /* Three horizontal bands — very lightly tinted */
              background: 'linear-gradient(180deg, #FFF5E6 0%, #FFF5E6 33.3%, #FAFFFE 33.3%, #FAFFFE 66.6%, #F0FFF4 66.6%, #F0FFF4 100%)',
            }}
          >
            {/* Subtle vertical stripe on left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{
                background: 'linear-gradient(180deg, #FF9933 0%, #FF9933 33.3%, #ffffff 33.3%, #ffffff 66.6%, #138808 66.6%, #138808 100%)',
              }}
            />

            <div className="flex items-center gap-4 px-5 py-3.5 pl-6">
              {/* Ashoka Chakra */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-sm"
                style={{ borderColor: '#000080', background: 'rgba(255,255,255,0.85)' }}
              >
                <div className="relative w-10 h-10">
                  <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: '#000080' }}
                  />
                  {/* 24 spokes */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 origin-left"
                      style={{
                        width: '50%',
                        height: '1px',
                        background: '#000080',
                        opacity: 0.75,
                        transform: `translateY(-50%) rotate(${i * 15}deg)`,
                        marginLeft: '-1px',
                      }}
                    />
                  ))}
                  <div
                    className="absolute inset-[32%] rounded-full"
                    style={{ background: '#000080' }}
                  />
                </div>
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-0.5"
                  style={{ color: '#000080' }}
                >
                  भारत सरकार &nbsp;·&nbsp; Government of India
                </p>
                <p className="text-base font-bold" style={{ color: '#1a1a2e' }}>
                  Ministry of Steel — Conveyor Belt Digital Twin Monitoring System
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                  इस्पात मंत्रालय &nbsp;·&nbsp; AI-Powered Predictive Maintenance Platform &nbsp;·&nbsp; POC Submission 2026
                </p>
              </div>

              {/* Right badges */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: '#13880818', border: '1px solid #13880844' }}
                >
                  <Shield size={12} style={{ color: '#138808' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#138808' }}>
                    Verified POC
                  </span>
                </div>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: 'linear-gradient(90deg,#FF993322,#13880818)',
                    color: '#7a3800',
                    border: '1px solid #FF993344',
                  }}
                >
                  Powered by DigitalTwin Team
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
