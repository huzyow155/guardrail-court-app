# Manual MetaMask Test Checklist (Guardrail Court V2)

This checklist enables any reviewer or developer to test the full live interaction cycle using MetaMask on GenLayer Studionet (Chain ID 61999).

---

## Prerequisites & Network Configuration

- **Network Name**: GenLayer Studionet
- **RPC URL**: `https://studio.genlayer.com/api`
- **Chain ID**: `61999` (Hex: `0xF22F`)
- **Currency Symbol**: `GEN`
- **Block Explorer URL**: `https://explorer-studio.genlayer.com`
- **V2 Court Address**: `0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b`
- **V2 Vault Address**: `0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58`

---

## Step-by-Step 8-Point Verification Checklist

### Step 1: Switch Network to Studionet
1. Open MetaMask.
2. In the network dropdown, choose **Add Network** -> **Add a network manually**.
3. Enter RPC URL `https://studio.genlayer.com/api` and Chain ID `61999`.
4. Confirm network switch. In the dApp header, verify the network pill displays `Studionet (61999)` with a green indicator.

### Step 2: Import / Fund Account
1. Ensure your active account has GEN test funds for transaction gas on Studionet.
2. Connect your wallet via the **Connect Wallet** button in the dApp header.
3. Confirm that your address appears in the header.

### Step 3: Create Policy with Allowlists (`/app/new`)
1. Navigate to `/app/new`.
2. Define a policy name (e.g. `Treasury Guard`).
3. Set **Max Amount** (e.g. `1000`) and **Window Cap** (e.g. `5000`).
4. Enter allowed recipients (one per line or comma-separated, e.g. `0x1111111111111111111111111111111111111111`).
5. Enter allowed asset symbols (e.g. `USDC`, `DAI`).
6. Click **Deploy Policy** and sign the transaction in MetaMask.
7. Wait for consensus confirmation (receipt check: `ACCEPTED` / `FINALIZED`, `MAJORITY_AGREE`).
8. Note the newly assigned Policy ID.

### Step 4: Submit Valid Action Matching Allowlists (`/app/request`)
1. Navigate to `/app/request`.
2. Select your Policy ID.
3. Choose category `TRANSFER`.
4. Enter the exact allowed recipient from Step 3.
5. Enter allowed asset `USDC` and amount `50`.
6. Enter calldata hash `0x0000000000000000000000000000000000000000000000000000000000000000` (or generate hash from string).
7. Enter justification (>= 10 characters).
8. Click **Submit Action Request** and confirm in MetaMask.
9. Verify decision outcome shows `ALLOW` with source `HARD_LIMIT` or `JUDGE`. Note the Decision ID.

### Step 5: Submit Action Violating Recipient Guard
1. In `/app/request`, keep the same Policy ID and parameters, but enter an unlisted recipient (e.g. `0x9999999999999999999999999999999999999999`).
2. Click **Submit Action Request** and confirm in MetaMask.
3. Verify the decision resolves deterministically with verdict `DENY` and badge `◆ RECIPIENT_GUARD` without calling the AI judge.

### Step 6: Submit Action Violating Asset Guard
1. In `/app/request`, revert recipient to the allowed address, but enter an unlisted asset (e.g. `XYZ`).
2. Click **Submit Action Request** and confirm in MetaMask.
3. Verify the decision resolves deterministically with verdict `DENY` and badge `▲ ASSET_GUARD` without calling the AI judge.

### Step 7: Execute Allowed Action via Guarded Vault (`/app/vault`)
1. Navigate to `/app/vault`.
2. Enter the Decision ID from Step 4.
3. Enter matching parameters: Policy ID, Category, Recipient, Asset, Amount, and Calldata Hash.
4. Verify clearance status displays `CLEARED: Action Hash matches on-chain clearance`.
5. Click **Execute via Guarded Vault** and sign the transaction in MetaMask.
6. Verify receipt confirmation: the UI updates to show `Executed: true`.

### Step 8: Replay Rejection Verification
1. On `/app/vault`, attempt to click **Execute via Guarded Vault** again for the same Decision ID.
2. Confirm the transaction in MetaMask (or observe the pre-check preventing submission).
3. Verify the transaction fails with contract UserError: `decision has already been executed`.
