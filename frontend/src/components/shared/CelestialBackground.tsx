'use client';

import React from 'react';

export function CelestialBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Layer 1: Sky Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#050214] via-[#0D0628] via-50% via-[#240E5A] to-[#3B1278]"
      />

      {/* Layer 2: 4-Point Starfield & Shooting Stars */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Scattered 4-point diamond stars */}
        {[
          { x: 140, y: 110, s: 1.2, op: 0.85, anim: 'animate-star-twinkle' },
          { x: 320, y: 70, s: 0.8, op: 0.5, anim: '' },
          { x: 480, y: 150, s: 1.5, op: 0.9, anim: 'animate-star-twinkle' },
          { x: 620, y: 50, s: 0.7, op: 0.4, anim: '' },
          { x: 740, y: 180, s: 1.1, op: 0.75, anim: 'animate-star-twinkle' },
          { x: 890, y: 90, s: 1.4, op: 0.8, anim: 'animate-star-twinkle' },
          { x: 1040, y: 220, s: 0.9, op: 0.6, anim: '' },
          { x: 1190, y: 120, s: 1.6, op: 0.95, anim: 'animate-star-twinkle' },
          { x: 1320, y: 260, s: 0.8, op: 0.5, anim: '' },
          { x: 90, y: 290, s: 1.0, op: 0.7, anim: 'animate-star-twinkle' },
          { x: 380, y: 340, s: 0.9, op: 0.45, anim: '' },
          { x: 790, y: 310, s: 1.3, op: 0.8, anim: 'animate-star-twinkle' },
          { x: 230, y: 450, s: 0.8, op: 0.5, anim: '' },
          { x: 960, y: 400, s: 1.2, op: 0.75, anim: 'animate-star-twinkle' },
          { x: 1120, y: 490, s: 0.7, op: 0.4, anim: '' },
          { x: 650, y: 540, s: 1.0, op: 0.6, anim: 'animate-star-twinkle' },
          { x: 1240, y: 60, s: 1.7, op: 0.95, anim: 'animate-star-twinkle' },
          { x: 40, y: 180, s: 1.2, op: 0.75, anim: '' },
        ].map((star, i) => (
          <g
            key={i}
            transform={`translate(${star.x}, ${star.y}) scale(${star.s})`}
            className={star.anim}
            opacity={star.op}
          >
            <circle cx="0" cy="0" r="1.5" fill="url(#starGlow)" />
            {/* 4-point diamond star cross */}
            <path
              d="M 0,-6 Q 0.5,-1 5,0 Q 0.5,1 0,6 Q -0.5,1 -5,0 Q -0.5,-1 0,-6 Z"
              fill="#FDE68A"
              opacity="0.9"
            />
          </g>
        ))}
      </svg>

      {/* Shooting Stars */}
      <div
        className="absolute top-[8%] left-[15%] w-48 h-[2px] bg-gradient-to-r from-transparent via-[#FDE68A] to-white animate-shooting-star-1 opacity-0 filter drop-shadow-[0_0_8px_#FBBF24]"
        style={{ transformOrigin: 'left center' }}
      />
      <div
        className="absolute top-[22%] left-[48%] w-60 h-[2px] bg-gradient-to-r from-transparent via-[#C084FC] to-white animate-shooting-star-2 opacity-0 filter drop-shadow-[0_0_10px_#A855F7]"
        style={{ transformOrigin: 'left center' }}
      />

      {/* Layer 3: Giant Ringed Crescent Planet (Top Right) */}
      <div className="absolute -top-16 -right-12 w-[340px] h-[340px] md:w-[520px] md:h-[520px] pointer-events-none opacity-40 md:opacity-60">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <radialGradient id="planetBody" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3B1278" />
              <stop offset="45%" stopColor="#1E0B4B" />
              <stop offset="85%" stopColor="#0B0524" />
              <stop offset="100%" stopColor="#050214" />
            </radialGradient>
            <radialGradient id="planetRimGlow" cx="25%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#7C3AED" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#3B1278" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(253, 230, 138, 0.9)" />
              <stop offset="35%" stopColor="rgba(192, 132, 252, 0.75)" />
              <stop offset="70%" stopColor="rgba(124, 58, 237, 0.4)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.1)" />
            </linearGradient>
            <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Planet body behind ring */}
          <circle cx="200" cy="200" r="110" fill="url(#planetBody)" />
          <circle cx="200" cy="200" r="110" fill="url(#planetRimGlow)" />
          
          {/* Subtle crater contours */}
          <circle cx="160" cy="165" r="24" fill="#140733" opacity="0.6" />
          <circle cx="225" cy="175" r="38" fill="#140733" opacity="0.45" />
          <circle cx="190" cy="230" r="30" fill="#140733" opacity="0.5" />

          {/* Sweeping tilted orbital ring */}
          <g transform="rotate(-24 200 200)" filter="url(#glowBlur)">
            {/* Outer ring */}
            <ellipse
              cx="200"
              cy="200"
              rx="180"
              ry="38"
              fill="none"
              stroke="url(#ringGlow)"
              strokeWidth="4"
              opacity="0.85"
            />
            {/* Inner ring */}
            <ellipse
              cx="200"
              cy="200"
              rx="164"
              ry="32"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.65"
            />
          </g>

          {/* Front crescent rim highlight */}
          <path
            d="M 120 135 A 110 110 0 0 1 290 270 A 106 106 0 0 0 120 135 Z"
            fill="#FDE68A"
            opacity="0.25"
          />
        </svg>
      </div>

      {/* Layer 4: Horizon Ambient Blooms */}
      <div
        className="absolute bottom-[10%] -left-[10%] w-[580px] h-[580px] rounded-full opacity-35 filter blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(76, 29, 149, 0.15) 50%, transparent 75%)',
        }}
      />
      <div
        className="absolute bottom-[5%] right-[5%] w-[480px] h-[480px] rounded-full opacity-30 filter blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.1) 45%, transparent 70%)',
        }}
      />

      {/* Layer 5: Wet-Pavement Courtyard Grid at Bottom (Perspective reflections) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[28vh] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(192, 132, 252, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(251, 191, 36, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 24px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
