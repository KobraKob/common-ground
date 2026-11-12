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
        neo: {
          bg: 'var(--color-bg, #F5F6FD)',
          bgDark: '#0E0F1A',
          surface: 'var(--color-surface, #FFFFFF)',
          surfaceDark: '#151726',
          border: 'var(--color-border, #CCCFFA)',
          borderDark: '#282C47',
          accent: 'var(--color-accent, #1A1C29)',
          neon: '#C5E17A',
          periwinkle: '#CCCFFA',
          obsidian: '#0E0F1A',
          charcoal: '#1A1C29',
          muted: '#686D8C',
        },
      },
      fontFamily: {
        display: ['"Crimson Text"', 'serif'],
        sans: ['"Poppins"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neo-hairline': 'inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        'neo-dark-rim': 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'neo-pill': '0 2px 0 #1A1C29',
      },
      borderRadius: {
        'neo': '6px',
        'composer': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
