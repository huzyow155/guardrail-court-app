# Guardrail Court dApp

> Advisory Policy Gate & Multi-Validator Clearance Protocol for Autonomous AI Agents on GenLayer Studionet.

This repository contains the front-end client interface and verification explorer for Guardrail Court. The intelligent contract source, formal tests, and deployment verification live in the contract repository: [`huzyow155/guardrail-court-genlayer`](https://github.com/huzyow155/guardrail-court-genlayer).

## Studionet Deployments (Preview)
- **Production URL**: [https://guardrail-court-app.vercel.app](https://guardrail-court-app.vercel.app)
- **Contract Repository**: [https://github.com/huzyow155/guardrail-court-genlayer](https://github.com/huzyow155/guardrail-court-genlayer)
- **Network**: GenLayer Studionet (Chain ID 61999)
- **RPC URL**: `https://studio.genlayer.com/api`
- **Block Explorer**: [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)

### Active V2 Intelligent Contracts
- **GuardrailCourtV2**: [`0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b`](https://explorer-studio.genlayer.com/address/0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b)
  - Deploy Transaction: `0x9010b9b20c6b21e0e980ac896a9f28708a195c419b5c8eca9b05426b4defab1b`
  - Contract Source Hash (SHA-256): `94BDA609903A2ECC854269307E628E49869A36B466DAE7CD941553406E12F9F6`
- **GuardedVaultV2**: [`0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58`](https://explorer-studio.genlayer.com/address/0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58)
  - Deploy Transaction: `0x7df07e95b5a20203845c23deb42e4e38724dc522b54be6b0101deb811ea1eb94`
  - Contract Source Hash (SHA-256): `7CB69D7745B0C9354ECA3D1D712EBF7099726298128C3C45E54F8C7CC2060366`

### Historical Contracts (v1 — superseded)
- **GuardrailCourt (v1)**: `0x6C553Ba27a768D71b570a106D9D2e13553b4103c` (superseded by V2)
- **GuardedVault (v1)**: `0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C` (superseded by V2)

- **License**: MIT (c) 2026 Hyper

---

## Overview

Guardrail Court V2 acts as an independent advisory gate between autonomous AI agents and downstream executors (such as GuardedVaultV2). Human operators define natural-language policy boundaries alongside deterministic spending caps, allowed recipients, and allowed assets.

GenLayer validators reach equivalence consensus on an explicit three-way enum:
- `ALLOW`: Permitted action clearing downstream verification. Action hash is cryptographically bound to parameters.
- `ESCALATE`: Ambiguity or velocity trips routed to the owner inbox.
- `DENY`: Hard boundary violation, allowlist rejection, or judge refusal.

---

## Architecture & Verification

1. **Pre-LLM Deterministic Guards**:
   - `HARD_LIMIT`: Immediate rejection if `amount > max_amount`.
   - `RECIPIENT_GUARD`: Immediate rejection if recipient is not in the policy allowlist.
   - `ASSET_GUARD`: Immediate rejection if asset ticker is not in the policy allowlist.
   - `VELOCITY`: Sum of cleared transactions in the policy's 15 latest decisions in the same category plus current amount exceeds window cap -> routes to `ESCALATE`.
2. **Multi-Validator Equivalence Consensus (`JUDGE`)**:
   - Evaluates qualitative intent against natural-language policy guidelines using `gl.eq_principle.strict_eq`.
   - Fail-closed JSON regex parsing: malformed or contradictory model responses fall back safely to `ESCALATE`.
3. **Action Hash Binding & Downstream Vault**:
   - Canonical action hash format: `GC2|policy_id|category|recipient|asset|amount|calldata_hash`.
   - Downstream contracts verify clearance using `is_cleared_for(...)` matching all parameters. Single-use enforcement prevents replay.

---

## Write Transactions & Consensus Clearance

The dApp supports full on-chain write operations on GenLayer Studionet (Chain ID 61999) via `src/services/contractWrite.ts` using `genlayer-js@1.1.8`. Both injected wallets (EIP-1193 / MetaMask) and programmatic signer accounts (throwaway keys) are supported.

### Contract Write Methods

| Method | Role Guard | Description |
| :--- | :--- | :--- |
| `create_policy(agent, text, max_amount, window_cap, allowed_recipients, allowed_assets)` | Any caller (becomes Owner) | Registers a policy with caps and allowlists. Returns new policy ID. |
| `set_paused(policy_id, paused)` | Policy Owner only | Temporarily pauses or unpauses policy execution. |
| `request_action(policy_id, category, recipient, asset, amount, calldata_hash, description)` | Policy Agent only | Submits an action request. Evaluated by pre-LLM guards or multi-validator JUDGE. |
| `resolve_escalation(decision_id, outcome)` | Policy Owner only | Resolves ambiguous or velocity-tripped escalations (`'ALLOW'` or `'DENY'`). |
| `vault_execute(decision_id, policy_id, category, recipient, asset, amount, calldata_hash)` | Any caller (via GuardedVaultV2) | Verifies action hash on GuardrailCourtV2 and executes transfer once. Replay rejected. |

All integer and ID arguments are strictly formatted and transmitted as strings to comply with the GenVM ABI standard.

### Error Handling & Contract UserErrors

All 30 unique `UserError` strings across both V2 contracts are mapped in `src/lib/errors.ts`. Transaction error payloads from `leader_receipt[0].result.payload` are decoded into user-friendly explanations.

### On-Chain Evidence & E2E Verification

On-chain execution flows are verified directly against Studionet validators:
- `scripts/e2e_write_flow.mjs`: Automated execution of the 10-step V2 write pipeline recorded in `docs/E2E_V2_EVIDENCE.json`.
- `scripts/e2e_browser_flow.mjs`: Headless Chrome E2E browser interactions with injected EIP-1193 provider, capturing screenshots in `docs/screenshots/app-*.png`.
- `docs/MANUAL_METAMASK_TEST.md`: 8-step manual testing guide for verifying MetaMask interactions.

---

## Known Limits

- **Historical Scope**: Velocity guard evaluates only the 15 latest decisions of the policy.
- **Strict Format**: Ticker symbols must be uppercase alphanumeric (2 to 10 characters). Calldata hash must be 32 bytes hex (`0x` + 64 hex characters).

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
