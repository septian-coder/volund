/**
 * Volund Reputation Score — Design tokens (JS/TS)
 * Mirrors src/styles/tokens.css for use in components and utils.
 * Rialo ecosystem · No pure white; accent = mint-teal #a9ddd3
 */

export const colors = {
  bg: {
    primary: '#010101',
    secondary: '#0d0d0d',
    elevated: '#111111',
    overlay: '#161616',
  },
  text: {
    primary: '#e8e3d5',
    secondary: '#b8b3a7',
    tertiary: '#706b61',
  },
  accent: {
    main: '#a9ddd3',
    dim: '#4a9d93',
    glow: 'rgba(169, 221, 211, 0.12)',
    border: 'rgba(169, 221, 211, 0.25)',
  },
  border: {
    subtle: 'rgba(232, 227, 213, 0.07)',
    default: 'rgba(169, 221, 211, 0.25)',
  },
  tier: {
    unverified: '#555555',
    bronze: '#CD7F32',
    silver: '#A8B4BC',
    gold: '#F5C842',
    platinum: '#B0C4DE',
    diamond: '#7DF9FF',
    volund: '#a9ddd3',
  },
  status: {
    success: '#a9ddd3',
    warning: '#F5C842',
    error: '#FF4D4D',
    info: '#60B8FF',
  },
} as const;

export const typography = {
  fontDisplay: "'Space Mono', 'IBM Plex Mono', monospace",
  fontBody: "'Inter', system-ui, sans-serif",
  fontMono: "'Space Mono', monospace",
  weightBody: 400,
  weightLabel: 500,
  weightHeading: 700,
} as const;

export const radius = {
  tag: 4,
  button: 6,
  card: 8,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

/** Score tier names in order (for getTier, badges, etc.) */
export const TIER_NAMES = [
  'unverified',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'volund',
] as const;

export type TierName = (typeof TIER_NAMES)[number];
