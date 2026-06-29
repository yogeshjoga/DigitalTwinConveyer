import React, { useEffect, useRef } from 'react';

// Expose a global function so HandTracking can update the cursor without React re-renders
declare global {
  interface Window {
    updateVirtualCursor: (x: number, y: number, isPinching: boolean, isActive: boolean) => void;
  }
}

export default function VirtualCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.updateVirtualCursor = (x, y, isPinching, isActive) => {
      if (!cursorRef.current || !ringRef.current || !dotRef.current) return;

      if (!isActive) {
        cursorRef.current.style.opacity = '0';
        return;
      }

      cursorRef.current.style.opacity = '1';
      cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (isPinching) {
        ringRef.current.style.transform = 'scale(0.5)';
        ringRef.current.style.borderColor = '#22c55e'; // Green when pinching
        ringRef.current.style.background = 'rgba(34, 197, 94, 0.4)';
        dotRef.current.style.transform = 'scale(1.5)';
        dotRef.current.style.background = '#22c55e';
      } else {
        ringRef.current.style.transform = 'scale(1)';
        ringRef.current.style.borderColor = '#3b82f6'; // Blue when open
        ringRef.current.style.background = 'rgba(59, 130, 246, 0.1)';
        dotRef.current.style.transform = 'scale(1)';
        dotRef.current.style.background = '#3b82f6';
      }
    };

    return () => {
      window.updateVirtualCursor = () => {};
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 99999, // Above absolutely everything
        opacity: 0,
        transition: 'opacity 0.2s',
      }}
    >
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: -24,
          left: -24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid #3b82f6',
          background: 'rgba(59, 130, 246, 0.1)',
          transition: 'transform 0.1s ease-out, border-color 0.1s, background 0.1s',
          boxShadow: '0 0 15px rgba(59,130,246,0.3)',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: -4,
          left: -4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#3b82f6',
          transition: 'transform 0.1s ease-out, background 0.1s',
        }}
      />
    </div>
  );
}
