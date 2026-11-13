import { defineTheme } from '@astryxdesign/core/theme';
import { y2kTheme } from '@astryxdesign/theme-y2k';

export const celestialTheme = defineTheme({
  name: 'celestial-nightscape',
  extends: y2kTheme,
  tokens: {
    '--bg-void': '#050214',
    '--bg-cosmos': '#0B0524',
    '--bg-nebula': '#160B3E',
    '--bg-horizon': '#2E1065',
    '--bg-glass-card': 'rgba(16, 9, 42, 0.68)',
    '--bg-glass-elevated': 'rgba(26, 14, 64, 0.82)',
    '--bg-glass-input': 'rgba(8, 4, 24, 0.78)',
    '--accent-amber-core': '#F59E0B',
    '--accent-amber-bright': '#FBBF24',
    '--accent-amber-soft': '#FDE68A',
    '--accent-violet-core': '#7C3AED',
    '--accent-violet-bright': '#A855F7',
    '--accent-orchid-glow': '#C084FC',
    '--text-starlight': '#F8F7FF',
    '--text-nebula-sec': '#C4B5FD',
    '--text-cosmos-muted': '#7C6FA6',
    '--border-hairline': 'rgba(168, 85, 247, 0.22)',
    '--border-specular-top': 'rgba(192, 132, 252, 0.42)',
    '--border-amber-glow': 'rgba(251, 191, 36, 0.45)',
  } as any,
  components: {
    'chat-composer': {
      base: { borderRadius: '16px' },
    },
  } as any,
});

export const neoY2kTheme = celestialTheme;

export const themeTokens = {
  void: '#050214',
  cosmos: '#0B0524',
  nebula: '#160B3E',
  horizon: '#2E1065',
  glassCard: 'rgba(16, 9, 42, 0.68)',
  glassElevated: 'rgba(26, 14, 64, 0.82)',
  glassInput: 'rgba(8, 4, 24, 0.78)',
  amberCore: '#F59E0B',
  amberBright: '#FBBF24',
  amberSoft: '#FDE68A',
  violetCore: '#7C3AED',
  violetBright: '#A855F7',
  orchidGlow: '#C084FC',
  starlight: '#F8F7FF',
  nebulaSec: '#C4B5FD',
  cosmosMuted: '#7C6FA6',
  borderHairline: 'rgba(168, 85, 247, 0.22)',
  borderSpecular: 'rgba(192, 132, 252, 0.42)',
  borderAmber: 'rgba(251, 191, 36, 0.45)',
};
