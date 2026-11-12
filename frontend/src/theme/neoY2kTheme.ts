import { defineTheme } from '@astryxdesign/core/theme';
import { y2kTheme } from '@astryxdesign/theme-y2k';

export const neoY2kTheme = defineTheme({
  name: 'neo-y2k',
  extends: y2kTheme,
  tokens: {
    // Tame the full periwinkle canvas into an airy ice-lavender light mode
    // and keep Y2K's deep navy-obsidian dark mode (#0E0F1A)
    '--color-bg': ['#F5F6FD', '#0E0F1A'],
    '--color-surface': ['#FFFFFF', '#151726'],
    // Pair deep charcoal in light mode with Y2K's signature neon green in dark mode
    '--color-accent': ['#1A1C29', '#C5E17A'],
    '--color-border': ['#CCCFFA', '#282C47'],
  } as any,
  components: {
    'chat-composer': {
      base: { borderRadius: '16px' },
    },
  } as any,
});

export const themeTokens = {
  light: {
    bg: '#F5F6FD',
    surface: '#FFFFFF',
    accent: '#1A1C29',
    border: '#CCCFFA',
    highlight: '#C5E17A',
    textPrimary: '#1A1C29',
    textMuted: '#686D8C',
  },
  dark: {
    bg: '#0E0F1A',
    surface: '#151726',
    accent: '#C5E17A',
    border: '#282C47',
    highlight: '#C5E17A',
    textPrimary: '#F5F6FD',
    textMuted: '#8D92B5',
  },
};
