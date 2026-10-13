# Guardrail Court — GenLayer Intelligent Contracts & dApp

> On-Chain Risk Control, Deterministic Spending Guards & Multi-Validator Consensus for Autonomous AI Agents on GenLayer Studionet.

## Live Deployment & Network
- **Production URL**: [https://guardrail-court-app.vercel.app](https://guardrail-court-app.vercel.app)
- **Network**: GenLayer Studionet (Chain ID `61999`)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Primary Contract (`GuardrailCourt.py`)**: [`0x6C553Ba27a768D71b570a106D9D2e13553b4103c`](https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c)
  - **Deploy Transaction**: `0xe7a7ec9e6e1b1cf9f07696d251dc08118b7c865121551107850abb2938d81136`
  - **Source SHA-256**: `DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC`
- **Consumer Contract (`GuardedVault.py`)**: [`0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C`](https://explorer-studio.genlayer.com/address/0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C)
  - **Deploy Transaction**: `0x8b966471667987e8b1731cbf622437f7093ed81149b1050b74b34e51b41300ce`
  - **Source SHA-256**: `34844351BD7B484E56E1A55425B73166803B8C3C3277E2F915BBE5BDEFB4D866`
- **License**: MIT (c) 2026 Hyper

---

## Repository Structure (Contracts + Frontend)

- `contracts/GuardrailCourt.py` — Official deployed GenLayer Intelligent Contract implementing `HARD_LIMIT`, `VELOCITY`, and multi-validator `JUDGE` consensus (`gl.eq_principle.strict_eq`).
- `contracts/GuardedVault.py` & `examples/consumer/GuardedVault.py` — Downstream consumer contract verifying `court.view().is_cleared(decision_id)` before executing payouts.
- `archive/GuardrailCourtCore.py` & `archive/Probe.py` — Milestone 0 & Milestone 1 Studionet runtime probe contracts.
- `scripts/deploy/` — Deployment manifest (`deployments.json`), live Studionet deployment & scenario scripts (`deploy_core.js`, `deploy_consumer.js`, `deploy_probe.js`, `run_live_evidence.js`, `fetch_receipts_fresh.js`, `fetch_state_fresh.js`).
- `tests/` — 27 Python contract unit tests (`test_real_contract_import.py`, `test_layer1_pure.py`, `test_layer2_mocked.py`, `test_layer3_consensus.py`, `test_edge_cases.py`, `test_injection_resistance.py`) plus receipt fixtures.
- `docs/` — Full protocol specification (`DESIGN.md`, `INTEGRATION.md`, `LIMITATIONS.md`, `ERROR_CODES.md`, `RECEIPTS.md`, `VERIFICATION.md`, `RUNTIME_NOTES.md`, `PRIOR_ART.md`).
- `src/` — React + TypeScript + `genlayer-js` frontend implemented in the **Crystal Blue** design system.

---

## Three Sequential Protection Layers

1. **`HARD_LIMIT` (Deterministic Per-Action Ceiling)**:
   - Rejects any proposal where `amount > max_amount` before calling validator models (~`5.26s` on Studionet).
2. **`VELOCITY` (Category Spend Slice Guard)**:
   - Inspects the 15 most recent decisions of the policy, filters by category, takes up to 10, and escalates to `PENDING_OWNER` when cumulative cleared spend plus the proposed amount exceeds `window_cap` (~`5.31s` on Studionet).
3. **`JUDGE` (Multi-Validator Equivalence Consensus)**:
   - Evaluates proposals against the owner's natural-language policy rules under `gl.eq_principle.strict_eq` (`19.02s` mean latency across $n=8$ Studionet runs).

---

## Verification & Development Commands

```bash
# Install frontend dependencies
npm install

# Run frontend unit & accessibility test suite (Vitest + axe-core)
npm test

# Run Python Intelligent Contract test suite (27 tests)
python -m unittest discover -s tests -p "test_*.py" -v

# Run WCAG 2.1 contrast audit on CSS tokens
node scripts/contrast.mjs

# Build production bundle
npm run build
```
