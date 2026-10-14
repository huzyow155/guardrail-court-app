# Guardrail Court dApp

> Advisory Policy Gate & Multi-Validator Clearance Protocol for Autonomous AI Agents on GenLayer Studionet.

This repository contains the front-end client interface and verification explorer for Guardrail Court. The intelligent contract source, formal tests, and deployment verification live in the contract repository: [`huzyow155/guardrail-court-genlayer`](https://github.com/huzyow155/guardrail-court-genlayer).

## Live Deployment & Network
- **Production URL**: [https://guardrail-court-app.vercel.app](https://guardrail-court-app.vercel.app)
- **Contract Repository**: [https://github.com/huzyow155/guardrail-court-genlayer](https://github.com/huzyow155/guardrail-court-genlayer)
- **Network**: GenLayer Studionet (Chain ID 61999)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Intelligent Contract**: [`0x6C553Ba27a768D71b570a106D9D2e13553b4103c`](https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c)
- **Deploy Transaction**: `0xe7a7ec9e6e1b1cf9f07696d251dc08118b7c865121551107850abb2938d81136`
- **Contract Source Hash**: `DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC`
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
   - `VELOCITY`: Among the policy's 15 latest decisions, cleared spend in the same category plus the new amount above window_cap escalates to the owner (deterministic, no LLM) (~5.30s).
2. **Multi-Validator Equivalence Consensus (`JUDGE`)**:
   - Evaluates qualitative intent against natural-language policy guidelines using `gl.eq_principle.strict_eq`.
   - Measured average latency: 19.02s across n=8 verified transactions on Studionet.
3. **Synchronous Cross-Contract Query**:
   - Downstream executors verify clearances with `court.view().is_cleared(decision_id)`.

---

## Known Limits

- **Parser Substring Scan**: Model parser falls back to scanning for `"verdict": "ALLOW"` in uppercase prose before checking DENY; prose mentioning that substring resolves to ALLOW.
- **Velocity Window**: Velocity guard evaluates only the 15 latest decisions of the policy (without real-world timestamps).
- **Advisory Status**: `is_cleared` is an advisory clearance signal; downstream vault contracts must explicitly call and enforce it before releasing funds.

Full verification details, threat model, and edge cases are documented in [`docs/LIMITATIONS.md`](https://github.com/huzyow155/guardrail-court-genlayer/blob/main/docs/LIMITATIONS.md) of the contract repository.

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
