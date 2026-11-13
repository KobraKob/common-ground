import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Celestial Campus Nightscape Palette
        celestial: {
          void: '#050214',
          cosmos: '#0B0524',
          nebula: '#160B3E',
          horizon: '#2E1065',
          card: 'rgba(16, 9, 42, 0.68)',
          elevated: 'rgba(26, 14, 64, 0.82)',
          input: 'rgba(8, 4, 24, 0.78)',
        },
        amber: {
          core: '#F59E0B',
          bright: '#FBBF24',
          soft: '#FDE68A',
        },
        violet: {
          core: '#7C3AED',
          bright: '#A855F7',
          orchid: '#C084FC',
        },
        text: {
          starlight: '#F8F7FF',
          nebula: '#C4B5FD',
          muted: '#7C6FA6',
        },
        // Legacy mapping redirected to new palette
        neo: {
          bg: '#050214',
          bgDark: '#050214',
          surface: '#160B3E',
          surfaceDark: '#160B3E',
          border: 'rgba(168, 85, 247, 0.22)',
          borderDark: 'rgba(168, 85, 247, 0.22)',
          accent: '#FBBF24',
          neon: '#FBBF24',
          periwinkle: '#C084FC',
          obsidian: '#050214',
          charcoal: '#0B0524',
          muted: '#7C6FA6',
        },
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'specular-card': '0 14px 40px -10px rgba(3, 1, 12, 0.75), inset 0 1px 0 0 rgba(255, 255, 255, 0.14)',
        'amber-glow': '0 0 20px rgba(251, 191, 36, 0.35)',
        'amber-glow-lg': '0 0 28px rgba(251, 191, 36, 0.55)',
        'violet-glow': '0 0 20px rgba(168, 85, 247, 0.35)',
        'violet-glow-lg': '0 0 28px rgba(168, 85, 247, 0.55)',
      },
      borderRadius: {
        'neo': '16px',
        'composer': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
