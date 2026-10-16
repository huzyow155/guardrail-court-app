# Contract Reference Copies

This directory contains read-only reference copies of the deployed Intelligent Contracts for Guardrail Court on GenLayer Studionet (Preview).

**Notice**: This is a read-only reference copy (bản tham chiếu chỉ đọc). The dApp frontend does not compile or deploy this contract.

## Upstream Source

- **Source Repository**: `huzyow155/guardrail-court-genlayer`
- **Reference Commit (V2)**: `f10210150dd72b97f8660e6a5c44b87216bcaf01`
- **Reference Commit (v1 legacy)**: `ebc73dffe2492ae76b83280a66a9615b19f49144`

## Deployments & Expected Hashes

| Contract | Status | Deployed Address | Deploy Transaction | Expected SHA-256 (LF line endings) |
| :--- | :--- | :--- | :--- | :--- |
| `GuardrailCourtV2.py` | Active | `0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b` | `0x9010b9b20c6b21e0e980ac896a9f28708a195c419b5c8eca9b05426b4defab1b` | `94BDA609903A2ECC854269307E628E49869A36B466DAE7CD941553406E12F9F6` |
| `GuardedVaultV2.py` | Active | `0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58` | `0x7df07e95b5a20203845c23deb42e4e38724dc522b54be6b0101deb811ea1eb94` | `7CB69D7745B0C9354ECA3D1D712EBF7099726298128C3C45E54F8C7CC2060366` |
| `GuardrailCourt.py` | superseded | `0x6C553Ba27a768D71b570a106D9D2e13553b4103c` | `0x9c313eeec6971a8fb1fef5ffbcf761a20b080ce32fe72944ea5f4a7c13488426` | `DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC` |
| `GuardedVault.py` | superseded | `0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C` | `0xa6218d6a3fc003cb030999583a48e65e648be165f3f0d2c673413da4663c6214` | `34844351BD7B484E56E1A55425B73166803B8C3C3277E2F915BBE5BDEFB4D866` |

These hashes are verified automatically by `scripts/verify_contract_hash.mjs` and the test suite (`npm run verify:contracts`).
