# Volund — Project Instructions
> Read this file before doing anything. This is the source of truth for the project.

---

## What is this project?

**Volund** is a Web3 on-chain reputation scoring app built on the **Rialo ecosystem**.
It is an **existing app** — we are adding and updating features, not building from scratch.

Always ask for the existing file structure before creating new files.
Never overwrite existing logic unless explicitly asked.

---

## What does Volund do?

Volund gives every wallet a **reputation score from 0 to 1000** based on their on-chain behavior.
The score unlocks access to DeFi pools, airdrops, DAO governance, and other gated features across the Rialo ecosystem.

Think of it as a transparent, verifiable, on-chain credit score — but for Web3.

---

## Score System

**5 categories, total 1000 pts:**

| Category | Max | What it measures |
|---|---|---|
| Onchain Activity | 300 | tx count, wallet age, ETH balance, RLO balance, contract interactions |
| DeFi Behavior | 250 | swaps, liquidity, lending, DeFi frequency on Rialo eco |
| Identity & Trust | 200 | Proof of Humanity level, ENS ownership |
| Social Reputation | 150 | GitHub, Twitter/X, Discord connections |
| Badge Achievements | 100 | bonus from owned soulbound badges |

**Score Tiers:**

| Score | Tier |
|---|---|
| 0–99 | Unverified |
| 100–199 | Bronze |
| 200–349 | Silver |
| 350–499 | Gold |
| 500–699 | Platinum |
| 700–849 | Diamond |
| 850–1000 | Volund (Legendary) |

---

## Badge System

Badges are **Soulbound NFTs (ERC-5484)** — non-transferable, wallet-bound achievements.

**Rarity tiers:** Common → Uncommon → Rare → Epic → Legendary → Divine

Each badge has:
- A **Claim flow** — tasks to earn it for the first time
- A **Renew flow** — tasks to keep it active
- A **gas fee** paid in **RLO token**

---

## Token: RLO (Rialo)

RLO is the native token of the Rialo ecosystem.
All badge operations (claim, renew) are paid in RLO.
Currently deployed on **Sepolia testnet**.

Always show RLO logo/symbol whenever token interactions are displayed.

---

## Tech Stack

- Ask the developer for the exact framework if unsure
- Default assumption: **React / Next.js** with **TypeScript**
- Animations: **Framer Motion**
- Charts: **Recharts** or **D3**
- Smart contracts: **Solidity**, deployed on Sepolia
- Styling: **CSS variables** (see rules.md for exact tokens)

---

## Features Being Built (Current Sprint)

1. **Badge Task System** — dynamic task queue for claiming and renewing badges
2. **Score Simulator** — preview score changes before taking real action
3. **Demo Wallet Eligible Access** — showcase wallet gating with 2 demo wallets
4. **Dark/Light Mode Fix** — global theme switch that works on all pages including docs
5. **Locked Badge Display Fix** — locked badges too dark in dark mode
6. **Score Breakdown** — transparent per-parameter breakdown with improvement tips
7. **Social Connect Simulation** — preview GitHub/Twitter/ENS score impact
8. **Proof of Humanity** — multi-layer anti-sybil verification flow
9. **Score Change Animations** — real-time score updates with tier upgrade celebration

---

## Important Rules

- This is an **existing app** — always check file structure first
- **Never hardcode colors** — always use CSS variables from rules.md
- All text must use **cream #e8e3d5**, never pure white
- All backgrounds must use **#010101 or dark variants**, never navy or gray
- All accents use **mint-teal #a9ddd3**, never pure green or blue
- RLO token must always be visually represented in any token interaction
- Badge locked state: use `grayscale + opacity`, never a black overlay
- Framer Motion for all animations, spring config: `{ stiffness: 180, damping: 18 }`
