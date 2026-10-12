# Guardrail Court dApp

> Advisory Policy Gate & Multi-Validator Clearance Protocol for Autonomous AI Agents on GenLayer Studionet.

## Live Deployment & Network
- **Production URL**: [https://guardrail-court-app.vercel.app](https://guardrail-court-app.vercel.app)
- **Network**: GenLayer Studionet (Chain ID 61999)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Intelligent Contract**: [`0x6C553Ba27a768D71b570a106D9D2e13553b4103c`](https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c)
- **Deploy Transaction**: `0xe7a7ec9e6e1b1cf9f07696d251dc08118b7c865121551107850abb2938d81136`
- **License**: MIT (c) 2026 Hyper

---

## Overview

Guardrail Court acts as an independent advisory gate between autonomous AI agents and downstream executors (Safe modules, paymasters, execution wrappers). Human operators define natural-language policy boundaries alongside deterministic spending caps. 

GenLayer validators reach equivalence consensus on an explicit three-way enum:
- `ALLOW`: Permitted action clearing downstream verification.
- `ESCALATE`: Subjective ambiguity, unparseable outputs, or velocity trips routed to the owner inbox.
- `DENY`: Hard boundary violation.

---

## Architecture & Verification

1. **Pre-LLM Deterministic Guards**:
   - `HARD_LIMIT`: Immediate rejection if `amount > max_amount` (~5.26s).
   - `VELOCITY`: Sum of recent cleared actions within the same category exceeding `window_cap` triggers fail-closed `ESCALATE` (~5.30s).
2. **Multi-Validator Equivalence Consensus (`JUDGE`)**:
   - Evaluates qualitative intent against natural-language policy guidelines using `gl.eq_principle.strict_eq`.
   - Measured average latency: 19.02s across n=8 verified transactions on Studionet.
3. **Synchronous Cross-Contract Query**:
   - Downstream executors verify clearances with `court.view().is_cleared(decision_id)`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Vitest test suite
npm test

# Build for production
npm run build
```
