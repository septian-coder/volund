# Volund — Design Rules & Tokens
> These rules are non-negotiable. Apply them to every component, every file, every line of UI code.

---

## Color Tokens

Create or update a `tokens.css` (or `design-tokens.ts`) file with these exact values.
Use CSS variables everywhere — zero hardcoded hex values in components.

```css
/* ── DARK MODE (default) ── */
[data-theme="dark"] {
  --bg-primary:      #010101;   /* main background — pure near-black */
  --bg-secondary:    #0d0d0d;   /* cards, panels */
  --bg-elevated:     #111111;   /* modals, dropdowns */
  --bg-overlay:      #161616;   /* hover fills, subtle surfaces */

  --text-primary:    #e8e3d5;   /* warm cream — ALL body text */
  --text-secondary:  #b8b3a7;   /* dimmer cream — labels, subtext */
  --text-tertiary:   #706b61;   /* very dim — placeholders, disabled */

  --accent:          #a9ddd3;   /* mint-teal — buttons, highlights, active states */
  --accent-dim:      #4a9d93;   /* darker mint — borders on hover, secondary accents */
  --accent-glow:     rgba(169, 221, 211, 0.12);
  --accent-border:   rgba(169, 221, 211, 0.25);

  --border-subtle:   rgba(232, 227, 213, 0.07);  /* cream hairline */
  --border-default:  rgba(169, 221, 211, 0.25);  /* active/focused border */

  --success:  #a9ddd3;
  --warning:  #F5C842;
  --error:    #FF4D4D;
  --info:     #60B8FF;
}

/* ── LIGHT MODE ── */
[data-theme="light"] {
  --bg-primary:      #f5f0e8;   /* warm cream bg */
  --bg-secondary:    #ede8dc;
  --bg-elevated:     #e5dfd3;
  --bg-overlay:      #ddd8cc;

  --text-primary:    #1a1a14;
  --text-secondary:  #4a4540;
  --text-tertiary:   #8a8578;

  --accent:          #2a7d74;   /* darker mint for light bg readability */
  --accent-dim:      #1a5a54;
  --accent-glow:     rgba(42, 125, 116, 0.10);
  --accent-border:   rgba(42, 125, 116, 0.30);

  --border-subtle:   rgba(26, 26, 20, 0.10);
  --border-default:  rgba(42, 125, 116, 0.30);

  --success:  #2a7d74;
  --warning:  #b58a00;
  --error:    #cc2222;
  --info:     #2255aa;
}

/* ── SCORE TIER COLORS (same in both modes) ── */
:root {
  --tier-unverified: #555555;
  --tier-bronze:     #CD7F32;
  --tier-silver:     #A8B4BC;
  --tier-gold:       #F5C842;
  --tier-platinum:   #B0C4DE;
  --tier-diamond:    #7DF9FF;
  --tier-volund:     #a9ddd3;
}
```

---

## Typography

```css
:root {
  --font-display: 'Space Mono', 'IBM Plex Mono', monospace;  /* headings, scores, numbers */
  --font-body:    'Inter', system-ui, sans-serif;             /* body text */
  --font-mono:    'Space Mono', monospace;                    /* code, addresses, tx hashes */

  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  36px;
}
```

---

## Spacing & Shape

```css
:root {
  --radius-sm:  4px;   /* tags, chips, badges */
  --radius-md:  6px;   /* buttons */
  --radius-lg:  8px;   /* cards, modals */
  --radius-xl:  12px;  /* large panels */
  --radius-full: 9999px; /* pills */
}
```

---

## Component Patterns

### Cards
```css
.card {
  background:    var(--bg-secondary);
  border:        1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding:       20px;
}

.card:hover {
  border-color: var(--accent-border);
}
```

### Primary Button
```css
.btn-primary {
  background:    var(--accent);
  color:         #010101;          /* ALWAYS dark text on mint bg */
  font-family:   var(--font-display);
  font-weight:   700;
  border-radius: var(--radius-md);
  border:        none;
  transition:    all 150ms ease;
}

.btn-primary:hover {
  filter:     brightness(1.08);
  box-shadow: 0 0 16px var(--accent-glow);
}
```

### Outlined Button
```css
.btn-outline {
  background:    transparent;
  color:         var(--accent);
  border:        1px solid var(--accent-border);
  border-radius: var(--radius-md);
}

.btn-outline:hover {
  background:   var(--accent-glow);
  border-color: var(--accent);
}
```

### Active / Selected State
```css
.selected {
  border: 2px solid var(--accent);
  box-shadow: 0 0 20px var(--accent-glow);
}
```

### Glow Effect (interactive elements)
```css
.glow {
  box-shadow: 0 0 20px var(--accent-glow);
}
```

---

## Badge Rules

### Unlocked badge
```css
.badge-unlocked {
  /* normal display, rarity border color */
  opacity: 1;
  filter: none;
}
```

### Locked badge — CRITICAL
```css
.badge-locked {
  /* NEVER use black overlay or solid dark background */
  filter:  grayscale(1) opacity(0.45);
  cursor:  not-allowed;
  position: relative;
}

.badge-locked::after {
  content:       '🔒';
  position:      absolute;
  bottom:        8px;
  right:         8px;
  font-size:     12px;
  background:    rgba(1, 1, 1, 0.75);
  padding:       2px 5px;
  border-radius: var(--radius-sm);
}
```

### In-progress badge
```css
.badge-in-progress {
  opacity: 0.75;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--accent-border); }
  50%       { border-color: var(--accent); box-shadow: 0 0 12px var(--accent-glow); }
}
```

---

## Access Gate States

### Granted
```css
.gate-granted {
  background:    rgba(169, 221, 211, 0.08);
  border:        1px solid rgba(169, 221, 211, 0.40);
  color:         var(--accent);
}
```

### Denied
```css
/* NOT harsh red — show improvement path, not a dead end */
.gate-denied {
  background:    rgba(255, 77, 77, 0.06);
  border:        1px solid rgba(255, 77, 77, 0.30);
  color:         #FF6B6B;
}
```

---

## Score Progress Bar

```css
.progress-track {
  background:    rgba(169, 221, 211, 0.15);
  border-radius: var(--radius-full);
  height:        6px;
}

.progress-fill {
  background:    var(--accent);
  border-radius: var(--radius-full);
  transition:    width 600ms ease;
}
```

---

## RLO Token Pill

```css
.rlo-pill {
  display:       inline-flex;
  align-items:   center;
  gap:           4px;
  background:    rgba(169, 221, 211, 0.12);
  border:        1px solid rgba(169, 221, 211, 0.30);
  border-radius: var(--radius-full);
  color:         var(--accent);
  font-family:   var(--font-mono);
  font-size:     var(--text-xs);
  padding:       2px 8px;
}
```

---

## Animation Config (Framer Motion)

```ts
// Spring — for numbers, score rings, bouncy elements
export const spring = {
  type: 'spring',
  stiffness: 180,
  damping: 18,
}

// Smooth — for fades, overlays, panels
export const smooth = {
  type: 'tween',
  duration: 0.25,
  ease: 'easeOut',
}

// Stagger — for lists appearing
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } }
}

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: smooth },
}
```

---

## Theme System

```ts
// ThemeProvider must wrap the ENTIRE app including docs pages
// Key: 'volund-theme'
// Values: 'dark' | 'light'
// Default: 'dark' — always dark first
// Fallback: prefers-color-scheme

// Apply to <html> tag:
document.documentElement.setAttribute('data-theme', theme)
```

---

## Hard Rules — Never Break These

| ❌ Never | ✅ Always |
|---|---|
| Pure white `#ffffff` text | Cream `#e8e3d5` text |
| Navy or gray backgrounds | Near-black `#010101` bg |
| Hardcoded hex in components | CSS variables |
| Black overlay on locked badges | `grayscale + opacity` filter |
| Pure green or blue accent | Mint-teal `#a9ddd3` |
| White text on mint button | Dark `#010101` text on mint |
| Harsh red for denied state | Subtle `rgba(255,77,77,0.06)` bg |
| Create new files without asking | Ask for file structure first |
