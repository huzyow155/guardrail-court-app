# GenLayer SDK & Studionet Runtime Notes

## 1. Network & Protocol Parameters
- **Network**: GenLayer Studionet
- **RPC Endpoint**: `https://studio.genlayer.com/api`
- **Chain ID**: 61999
- **Gas Model**: Gas price is 0 on Studionet. Transactions execute without prior funding (`balance = 0` works directly).
- **Client Configuration**: `createClient({ chain: chains.studionet, account })` from `genlayer-js@1.1.8`.

## 2. Parameter Typing Rules for Intelligent Contracts
- **String Keys in TreeMaps**:
  - `policy_id` and `decision_id` are stored internally as `str` in GenVM `TreeMap`.
  - When invoking `readContract` or `writeContract`, `policy_id` and `decision_id` **MUST** be passed as string primitives (e.g., `args: ["1"]`).
  - Passing integers (e.g., `args: [1]`) results in Python `TypeError: '<' not supported between instances of 'int' and 'str'` in GenVM.
- **Amounts and Caps**:
  - `max_amount` and `window_cap` must be numeric strings (e.g. `"100"`).
- **Policy Text Constraints**:
  - Must be between 30 and 1200 characters. Shorter text triggers a UserError.
- **Owner and Agent Addresses**:
  - Setting `owner == agent` is explicitly permitted by the contract logic and functions properly for standalone test scripts.

## 3. Transaction Receipt Lifecycles
- `status_name`: `ACCEPTED` immediately upon validator block inclusion; progresses to `FINALIZED` in later blocks.
- `result_name`: `MAJORITY_AGREE` confirms multi-validator consensus agreement.
- `leader_receipt[0].execution_result`: `SUCCESS` indicates successful state transition.

## 4. Latency Characteristics (Measured)
- Deterministic writes (`create_policy`, `HARD_LIMIT` rejection): ~5.26s - 5.55s.
- Consensus evaluation (`JUDGE` LLM path): 11.93s - 32.03s (arithmetic mean 19.02s).
- View reads (`readContract`): < 1.0s.

## 5. Wallet & Provider Compatibility
- Supports standard EIP-1193 (`window.ethereum`) and EIP-6963 provider discovery.
- Read operations operate anonymously without wallet connection via public RPC client.
- Write operations require either an injected wallet connected to Chain ID 61999 or local burner account for scripts.
