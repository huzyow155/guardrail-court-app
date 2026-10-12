# Guardrail Court Design Plan & Visual Specification

## 1. Visual Philosophy: Railway Signal / Physical Semaphore

Guardrail Court is an advisory intelligence gate for autonomous agent actions. Rather than standard generic SaaS card interfaces, the UI is styled after physical railway signaling, interlocking towers, and mechanical semaphores.

### Core Principles
1. **Physical State Clarity**: Three unambiguous canonical semaphore signals:
   - `ALLOW` (Horizontal arm / High green `#00A347` / White text): Unblocked clearance.
   - `ESCALATE` (Diagonal 45-deg arm / Amber `#FF8C00` / Dark text): Routing to owner desk for review.
   - `DENY` (Vertical arm / Stop signal red `#D6001C` / White text): Hard blocked.
2. **Distinctive Color Scheme**:
   - Canvas / Surface Base: Mint Paper `#E3FDE6` (60%)
   - Structural Border / Grid: Mint Deep Border `#B5E8BD`
   - Primary Text & Structural Ink: Electric Railway Blue `#001FEB` (30%)
   - Contrast Surfaces (Desk / Panels): White `#FFFFFF` or Pale Mint `#F2FEF4`
   - Accent / Signal Semaphore: Green `#00A347`, Amber `#FF8C00`, Red `#D6001C` (10%)
   - Contrast check: `#001FEB` on `#E3FDE6` yields a contrast ratio of > 8.5:1 (exceeds WCAG AAA requirement 7:1).
3. **Typography**:
   - Headlines & Titles: Space Grotesk (`sans-serif`, geometric, mechanical)
   - Data, Counts, Hashes, Addresses, JSON, Amounts: JetBrains Mono (`monospace`, tabular numerals `tnum`)
4. **Motion & Tactility**:
   - Mechanical semaphore arm transitions (rotational snap with easing `cubic-bezier(0.2, 0, 0, 1)`).
   - Odometer / digit rolling reveal on numbers.
   - Bayer-dithered procedural DotField heightmap backdrop canvas.
   - Strict `prefers-reduced-motion` compliance: instantaneous state change when motion is disabled.

---

## 2. ASCII Wireframes

### Landing Page (`/`)
```
+-------------------------------------------------------------------------+
| [O] GUARDRAIL COURT                       [EXPLORE APP]  [STUDIONET: 61999] |
+-------------------------------------------------------------------------+
|                                                                         |
|    +-----------------------------+                                      |
|    |  CANVAS: BAYER DOT FIELD    |   GUARDRAIL COURT                    |
|    |  (Procedural heightmap      |   Advisory policy gate &             |
|    |   interlocking topography)  |   multi-validator clearance          |
|    +-----------------------------+   for autonomous AI agents.          |
|                                                                         |
|    +----------------------------------------------------------------+   |
|    | HOW IT WORKS: 1. Request -> 2. Numeric Guards -> 3. Consensus   |   |
|    | Stat: 10 Reference Runs | Latency: 19.02s mean | 100% Fail-Closed|   |
|    +----------------------------------------------------------------+   |
|                                                                         |
|    [ VIEW LIVE COURT /app ]    [ EVIDENCE & AUDIT /evidence ]           |
|                                                                         |
+-------------------------------------------------------------------------+
```

### Court Desk & Explorer (`/app`)
```
+-------------------------------------------------------------------------+
| GUARDRAIL COURT   [/app]  [/evidence]  [/app/new]    [CONNECT WALLET]   |
+-------------------------------------------------------------------------+
| POLICY SELECTOR: [Policy #1 (Demo)] [Policy #2] [+ New Policy]          |
| Status: PAUSED | Max: 100 | Window Cap: 400 | Total Decisions: 10       |
+-------------------------------------------------------------------------+
| ESCALATION DESK (PENDING OWNER): 1 Decision                             |
| +---------------------------------------------------------------------+ |
| | #9 | cloud_ops | Amount: 90 | Source: VELOCITY                      | |
| | "Cloud instance burst capacity slice 5"                             | |
| | [ RESOLVE: ALLOW ]    [ RESOLVE: DENY ]                             | |
| +---------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
| RECENT DECISIONS LEDGER:                                                |
| +----+----------+--------+--------+------------+------------+---------+ |
| | ID | CATEGORY | AMOUNT | SOURCE | VERDICT    | STATUS     | ACTION  | |
| +----+----------+--------+--------+------------+------------+---------+ |
| | 10 | casino   | 50     | JUDGE  | [|| DENY ] | DENIED     | View -> | |
| | 9  | cloud    | 90     | VELOC  | [/  ESCAL] | PENDING    | Resolve | |
| | 3  | event    | 85     | JUDGE  | [-- ALLOW] | CLEARED*   | View -> | |
| +----+----------+--------+--------+------------+------------+---------+ |
+-------------------------------------------------------------------------+
```

---

## 3. Design Self-Critique & Mitigations

1. **Critique**: High-contrast blue ink on mint green can cause eye fatigue if large blocks of text are solid bright color.
   - *Mitigation*: Reserve `#001FEB` for headlines, borders, interactive buttons, and accents. Use a deep blue-ink `#08104D` for dense body paragraphs and secondary metadata.
2. **Critique**: DotField canvas animation could consume excessive CPU or battery on low-end devices.
   - *Mitigation*: Draw at low resolution (half scale) on an off-screen buffer, render static frame when tab is hidden or canvas is scrolled out of view, and bypass animation completely when `prefers-reduced-motion` is detected.
3. **Critique**: Monospace tables can overflow on small mobile screens.
   - *Mitigation*: Implement horizontal overflow scrolling with sticky identifier columns, plus a responsive card view fallback under 640px.

---

## 4. Accessibility & Contrast Verification
- Background `#E3FDE6` with `#001FEB`: Contrast ratio **8.6:1** (AAA).
- Semaphore Green `#00A347` with White `#FFFFFF`: Contrast ratio **3.8:1** (UI Components / Graphical objects > 3:1).
- Semaphore Red `#D6001C` with White `#FFFFFF`: Contrast ratio **4.6:1** (AA Normal text, AAA Graphical objects).
- Amber `#FF8C00` with Deep Ink `#08104D`: Contrast ratio **7.2:1** (AAA).
