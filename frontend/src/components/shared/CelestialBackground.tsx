'use client';

import React from 'react';

/**
 * Subtle Midnight Sky Canvas.
 * Free of noisy neon purple washes; refined obsidian space with quiet amber horizon warmth.
 */
export function CelestialBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Layer 1: Deep Obsidian Midnight Canvas */}
      <div className="absolute inset-0 bg-[#0A0C12]" />

      {/* Layer 2: Subtle Ambient Warm Amber Glow at Top-Right & Center */}
      <div
        className="absolute -top-32 right-0 w-[600px] h-[600px] rounded-full opacity-20 filter blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.08) 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full opacity-15 filter blur-[100px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 65%)',
        }}
      />

      {/* Layer 3: Minimal Starfield (Quiet, crisp points) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {[
          { x: 120, y: 80, r: 1 },
          { x: 280, y: 160, r: 1.5 },
          { x: 450, y: 90, r: 1 },
          { x: 620, y: 220, r: 1.2 },
          { x: 780, y: 110, r: 1.5 },
          { x: 920, y: 180, r: 1 },
          { x: 1080, y: 70, r: 1.5 },
          { x: 1240, y: 190, r: 1.2 },
          { x: 180, y: 340, r: 1 },
          { x: 520, y: 420, r: 1.5 },
          { x: 860, y: 360, r: 1.2 },
          { x: 1150, y: 460, r: 1 },
        ].map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#F8F9FA"
            opacity="0.75"
          />
        ))}
      </svg>

      {/* Layer 4: Quiet Perspective Grid at Bottom (Subtle ground plane) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[22vh] pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245, 158, 11, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 24px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
