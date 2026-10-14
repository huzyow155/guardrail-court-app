# Reference Analysis: Single-File Template Architecture

## 1. Overview & Source
- **Origin**: User-provided reference template.
- **Scope**: Single-page dark hero layout with top navigation, centered value proposition, action buttons, and a bottom 3-item metrics bar.

## 2. Structure & Grid
- **Document Model**: Flex/Grid hybrid structured inside `.page` (`display: grid; grid-template-rows: auto 1fr auto`).
- **Header**: 3-column grid (`grid-template-columns: 1fr auto 1fr; align-items: center`).
  - Left: Logo mark + text.
  - Center: Pill navigation links with metallic border/hover sweep.
  - Right: Primary CTA button and mobile burger toggle.
- **Hero**: Flex container (`display: flex; align-items: flex-end; justify-content: center`) containing `.hero-copy` (max-width 860px).
  - Badge with sparkle/star icon.
  - Headline (`h1`) with two lines, emphasizing secondary words with italic serif.
  - Lede paragraph (`max-width: 470px`).
  - Dual action buttons (Solid metallic primary + translucent ghost secondary).
- **Footer Metrics Bar**: 3-column flex bar (`justify-content: space-between; gap: 24px`) displaying icon + quantitative social proof.

## 3. Color Tokens
- `--bg`: `#000000` (pure black canvas)
- `--text`: `#ffffff` (primary white)
- `--muted`: `#9a9a9a` (secondary text, italic accents, lede)
- `--stat`: `#d8d8d8` (metrics text color)
- `--border`: `rgba(255, 255, 255, 0.16)` (card & widget hairline borders)
- `--border-soft`: `rgba(255, 255, 255, 0.12)`
- **Metallic Gradients**:
  - Primary button: `linear-gradient(180deg, #fff 0%, #e7e7e7 48%, #cfcfcf 100%)`
  - Nav pills: `linear-gradient(105deg, #050505 0%, #2a2a2a 48%, #4a4a4a 100%)`
  - Ghost button: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.45) 50%, rgba(160,175,200,0.08))`
  - Badge: `linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%)`
  - Sheen sweep (`::after`): `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 48%, transparent 76%)`
- **Ambient Lighting**: Multi-layer radial & conic gradients (`.ambient-backdrop`) simulating subtle deep blue and purple aurora glow.

## 4. Typography
- **Primary Sans**: `Inter`, weights 400, 500, 600. Letter-spacing -0.01em to -0.045em.
- **Display Accent**: `Instrument Serif` (italic 400), applied to `<em>` tags within headlines.
- **Scale**:
  - H1: 48px desktop (scales from 34px mobile to 76px on 1920px+).
  - Lede: 15.5px desktop.
  - Nav & Buttons: 13.5px - 14px.
  - Badge: 12.5px.
  - Metrics: 13.5px.

## 5. Animations & Keyframes
- **Timing Function**: `cubic-bezier(0.16, 1, 0.3, 1)` (quintic decelerate pop).
- **Duration**: 0.9s - 1.4s with staggered `--d` delays (0.08s to 1.44s).
- **Animation Classes**:
  - `.appear--scale`: Scale up from 0.84 to 1.
  - `.appear--soft`: Translate Y from 14px to 0.
  - `.appear--mask`: Translate Y from 40% with overflow clipping.
  - `.appear--pop`: Scale overshoot (0.9 -> 1.03 -> 1.0).
  - `.appear--btn`: Translate Y from 18px and scale from 0.94.
  - `.appear--side`: Translate X from 22px to 0.
  - `.appear--stat`: Translate Y from 20px to 0.
- **Continuous Ambient**:
  - `@keyframes ambient-drift`: 18s ease-in-out infinite alternate.
  - `@keyframes aurora-sway`: 16s ease-in-out infinite alternate.
  - Sheen hover effect: CSS transition on `transform: translateX(120%)`.

## 6. External Assets & Bundle Footprint
- **Third-Party Video**: Proprietary external video asset (removed for licensing and offline autonomy).
- **Google Fonts CDN**: `fonts.googleapis.com` (Removed; replaced by bundled `@fontsource/inter` and `@fontsource/instrument-serif`).
- **Icons**: Inline SVGs (No external icon font).

## 7. Deviations & Accessibility Fixes
1. **Desktop Scroll Lock Bug**:
   - *Sample flaw*: Applied `html, body { height: 100%; overflow: hidden }` at `min-width: 901px`, preventing document scrolling.
   - *Fix*: Removed scroll locking. The hero maintains natural dimensions, allowing smooth scrolling into subsequent product sections.
2. **External Video Replacement**:
   - *Fix*: Replaced external video with real-time interactive canvas `DotField` (luminous dots on dark background with mouse/scroll/transaction ripple interaction).
3. **Contrast & Font Weight**:
   - *Sample flaw*: Certain muted texts (`#9a9a9a` on dark backgrounds) require strict compliance with WCAG AA (≥4.5:1) for body text and (≥3:1) for large text.
   - *Fix*: Verified with automated contrast checker; elevated critical text brightness and ensured semaphore badges (ALLOW/ESCALATE/DENY) utilize distinct geometric iconography alongside color.
4. **React & Reduced Motion Integration**:
   - *Sample flaw*: Native imperative DOM listeners (`animationend`) with class mutations.
   - *Fix*: Encapsulated into declarative React hook `useReveal`, with full `@media (prefers-reduced-motion: reduce)` support disabling transforms and delays.
5. **Brand & Content Substitution**:
   - Replaced all placeholder text with Guardrail Court verified on-chain metrics: JUDGE latency 19.02s mean, 3 protection layers, and 29 verified receipts.
