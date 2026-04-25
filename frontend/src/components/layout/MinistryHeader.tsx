/**
 * MinistryHeader — Official Indian Ministry of Steel branding banner.
 * Shown at the top of the Dashboard for government submission context.
 */
import { Shield } from 'lucide-react';

export default function MinistryHeader() {
  return (
    <div
      className="rounded-xl overflow-hidden mb-2"
      style={{
        background: 'linear-gradient(135deg, #FF9933 0%, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%, #138808 100%)',
        padding: '2px',
      }}
    >
      <div
        className="rounded-[10px] flex items-center gap-4 px-5 py-3"
        style={{ backgroundColor: 'var(--color-panel)' }}
      >
        {/* Ashoka Chakra placeholder */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{ borderColor: '#000080', background: '#f8f9ff' }}
        >
          {/* 24-spoke wheel approximation using CSS */}
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: '#000080' }}
            />
            {/* Spokes */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  width: '50%',
                  height: '1.5px',
                  background: '#000080',
                  transform: `translateY(-50%) rotate(${i * 30}deg)`,
                  marginLeft: '-1px',
                }}
              />
            ))}
            <div
              className="absolute inset-[35%] rounded-full"
              style={{ background: '#000080' }}
            />
          </div>
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-primary" style={{ color: '#000080' }}>
              भारत सरकार · Government of India
            </p>
          </div>
          <p className="text-sm font-bold text-primary mt-0.5">
            Ministry of Steel — Conveyor Belt Digital Twin Monitoring System
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            इस्पात मंत्रालय · AI-Powered Predictive Maintenance Platform · POC Submission 2026
          </p>
        </div>

        {/* Right: shield + team tag */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield size={13} style={{ color: '#138808' }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#138808' }}>
              Verified POC
            </span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#FF993322', color: '#cc6600', border: '1px solid #FF993344' }}
          >
            Powered by DigitalTwin Team
          </span>
        </div>
      </div>
    </div>
  );
}
