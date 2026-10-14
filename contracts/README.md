# Contract Reference Copies

This directory contains read-only reference copies of the deployed Intelligent Contracts for Guardrail Court.

**Notice**: This is a read-only reference copy. The dApp frontend does not compile or deploy this contract.

## Upstream Source

- **Source Repository**: `huzyow155/guardrail-court-genlayer`
- **Reference Commit**: `ebc73dffe2492ae76b83280a66a9615b19f49144` (and imported at `5dd00ef`)

## Deployments & Expected Hashes

| Contract | Deployed Address | Expected SHA-256 (LF line endings) |
| :--- | :--- | :--- |
| `GuardrailCourt.py` | `0x6C553Ba27a768D71b570a106D9D2e13553b4103c` | `DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC` |
| `GuardedVault.py` | `0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C` | `34844351BD7B484E56E1A55425B73166803B8C3C3277E2F915BBE5BDEFB4D866` |

These hashes are verified automatically by `scripts/verify_contract_hash.mjs` and the test suite (`npm run verify:contracts`).
