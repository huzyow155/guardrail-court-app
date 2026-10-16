# Evidence V2 Data

This directory stores raw on-chain execution evidence recorded from GenLayer Studionet (Preview).

## Upstream Provenance

- **Repository**: `huzyow155/guardrail-court-genlayer`
- **Commit**: `f10210150dd72b97f8660e6a5c44b87216bcaf01`
- **Court V2 Contract**: `0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b`
- **Vault V2 Contract**: `0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58`

## Files Included

- `case_01_clean.json`: Clean request through JUDGE, recorded decision 1 with action hash parity.
- `case_02_hard_limit.json`: Deterministic rejection exceeding policy max limit.
- `case_03_recipient_asset_guard.json`: Allowlist checks on recipient and asset.
- `case_04b_velocity_live.json`: Live velocity guard trip at decision 23 (8.75s) and decision 22.
- `case_04_velocity_resolve.json`: Owner escalation resolution flow.
- `case_05_semantic_injection.json`: Semantic jailbreak denial by LLM consensus.
- `case_06_parser_fail_closed.json`: Fail-closed parser behavior on adversarial malformed outputs.
- `case_07_pause.json`: Owner pause and unpause enforcement.
- `case_08_pending_cap.json`: Pending escalation queue bounds.
- `case_09_vault.json`: Downstream execution on GuardedVaultV2 and replay rejection.
- `case_10_validation.json`: Input validation checks and UserError messages.
- `case_11_latency.json`: Latency measurements across pure guards vs model calls.
- `case_12_stats.json`: Policy statistics across all runs.
- `deploy_court_receipt.json` & `deploy_vault_receipt.json`: Deployment transaction receipts.
- `GuardrailCourtV2_onchain.py` & `GuardedVaultV2_onchain.py`: Source code verified on chain.
