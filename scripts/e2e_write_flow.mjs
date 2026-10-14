import fs from 'node:fs';
import path from 'node:path';
import { createClient, createAccount, chains } from 'genlayer-js';

const COURT_ADDRESS = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';

function loadPrivateKey() {
  if (process.env.THROWAWAY_PRIVATE_KEY) {
    return process.env.THROWAWAY_PRIVATE_KEY.trim();
  }
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/THROWAWAY_PRIVATE_KEY\s*=\s*([^\r\n]+)/);
    if (match) {
      return match[1].trim();
    }
  }
  throw new Error('No THROWAWAY_PRIVATE_KEY found in process.env or .env');
}

async function run() {
  console.log('=== STARTING REAL ON-CHAIN E2E WRITE FLOW (STUDIONET 61999) ===');
  const privateKey = loadPrivateKey();
  const account = createAccount(privateKey);
  console.log('Using Burner/Throwaway Account:', account.address);
  console.log('Target Contract:', COURT_ADDRESS);

  const client = createClient({
    chain: chains.studionet,
    account,
  });

  const records = [];

  async function executeStep(stepName, functionName, args, expectedOutcomeDesc) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`[${stepName}] Calling ${functionName}(${args.map(a => JSON.stringify(a)).join(', ')})`);
    console.log(`Expected: ${expectedOutcomeDesc}`);
    const startTime = Date.now();

    try {
      const txHash = await client.writeContract({
        address: COURT_ADDRESS,
        functionName,
        args,
        value: 0n,
      });

      console.log(`  -> Broadcast Tx: ${txHash}`);
      console.log(`  -> Waiting for Studionet multi-validator consensus...`);

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        interval: 2000,
        retries: 45,
      });

      const latencySec = ((Date.now() - startTime) / 1000).toFixed(2);
      const leader = receipt.consensus_data?.leader_receipt?.[0];
      const execResult = leader?.execution_result || 'UNKNOWN';
      const consensus = receipt.result_name || 'UNKNOWN';
      const status = receipt.status_name || 'UNKNOWN';

      let payload = '';
      if (leader?.result?.payload) {
        payload = leader.result.payload.readable || JSON.stringify(leader.result.payload);
      } else if (leader?.genvm_result?.error_description) {
        payload = leader.genvm_result.error_description;
      }

      console.log(`  ✓ Decided: Status=${status}, Consensus=${consensus}, Leader=${execResult}, Latency=${latencySec}s`);
      console.log(`  ✓ Payload/Return: ${payload}`);

      const rec = {
        step: stepName,
        function: functionName,
        args,
        txHash,
        status,
        consensus,
        execResult,
        latencySec: Number(latencySec),
        payload,
        error: null,
      };
      records.push(rec);
      return { success: true, rec, receipt };
    } catch (err) {
      const latencySec = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  ✗ Execution error / rejected: ${err.message}`);
      const rec = {
        step: stepName,
        function: functionName,
        args,
        txHash: err.receipt?.hash || err.hash || 'N/A',
        status: err.receipt?.status_name || 'REVERTED',
        consensus: err.receipt?.result_name || 'N/A',
        execResult: 'ERROR',
        latencySec: Number(latencySec),
        payload: err.message,
        error: err.message,
      };
      records.push(rec);
      return { success: false, rec, error: err };
    }
  }

  // 1. Create Policy
  const policyText = 'The agent may buy cloud services, domains, and developer tools. Prohibit adult content, gambling, gifts, and cryptocurrency. Ambiguous or suspicious requests must escalate.';
  const maxAmount = '100';
  const windowCap = '80'; // 50 (first action) + 50 (third action) = 100 > 80 (trips VELOCITY)

  const res1 = await executeStep(
    'Step 1: create_policy',
    'create_policy',
    [account.address, policyText, maxAmount, windowCap],
    'New Policy ID generated on Studionet'
  );

  let newPolicyId = '7';
  if (res1.rec.payload) {
    try {
      newPolicyId = String(JSON.parse(res1.rec.payload));
    } catch {
      newPolicyId = String(res1.rec.payload).replace(/['"]/g, '');
    }
  }
  console.log(`\n>>> Created Active Policy ID: #${newPolicyId} <<<`);

  // 2. (a) request_action (ALLOW, JUDGE)
  const resA = await executeStep(
    'Step 2a: request_action (ALLOW)',
    'request_action',
    [newPolicyId, 'cloud_ops', '50', 'Subscribing to dedicated GPU cloud server for dev machine training'],
    'JUDGE -> ALLOW -> CLEARED'
  );

  // 3. (b) request_action (DENY, HARD_LIMIT)
  const resB = await executeStep(
    'Step 2b: request_action (HARD_LIMIT)',
    'request_action',
    [newPolicyId, 'infrastructure', '150', 'Annual enterprise server hardware purchase'],
    'HARD_LIMIT -> DENY (amount 150 > max 100)'
  );

  // 4. (c) request_action (ESCALATE, VELOCITY)
  const resC = await executeStep(
    'Step 2c: request_action (VELOCITY ESCALATE)',
    'request_action',
    [newPolicyId, 'cloud_ops', '50', 'Subscribing to second cloud server slice part 2'],
    'VELOCITY -> ESCALATE (50 + 50 = 100 > window_cap 80) -> PENDING_OWNER'
  );

  let escalatedDecisionId = '18';
  if (resC.rec.payload) {
    try {
      escalatedDecisionId = String(JSON.parse(resC.rec.payload));
    } catch {
      escalatedDecisionId = String(resC.rec.payload).replace(/['"]/g, '');
    }
  }
  console.log(`\n>>> Escalated Decision ID: #${escalatedDecisionId} <<<`);

  // 5. (d) resolve_escalation (ALLOW)
  const resD = await executeStep(
    'Step 2d: resolve_escalation',
    'resolve_escalation',
    [escalatedDecisionId, 'ALLOW'],
    'Owner approves ambiguous request -> CLEARED'
  );

  // 6. (e) set_paused(policy_id, true) then test rejection
  const resE1 = await executeStep(
    'Step 2e-1: set_paused(true)',
    'set_paused',
    [newPolicyId, true],
    'Owner pauses policy'
  );

  const resE2 = await executeStep(
    'Step 2e-2: request_action (REJECTED)',
    'request_action',
    [newPolicyId, 'cloud_ops', '20', 'Another cloud subscription while paused'],
    'Transaction rejects with error "policy is paused"'
  );

  // Save evidence
  const evidencePath = path.resolve('docs', 'E2E_WRITE_EVIDENCE.json');
  fs.writeFileSync(evidencePath, JSON.stringify({
    timestamp: new Date().toISOString(),
    network: 'GenLayer Studionet (Chain ID 61999)',
    contractAddress: COURT_ADDRESS,
    callerAccount: account.address,
    policyId: newPolicyId,
    escalatedDecisionId,
    records,
  }, null, 2));

  console.log(`\n============================================================`);
  console.log(`E2E ON-CHAIN WRITE FLOW COMPLETE! Evidence written to ${evidencePath}`);
  console.log(`============================================================\n`);

  console.log(`### BẢNG BẰNG CHỨNG GIAO DỊCH THẬT TRÊN STUDIONET (CHAIN ID 61999)\n`);
  console.log(`| Bước | Function | Tx Hash | Consensus | Status | Latency (s) | Result / Payload |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`);
  records.forEach((r) => {
    const hashDisplay = r.txHash && r.txHash.startsWith('0x')
      ? `[\`${r.txHash.slice(0, 10)}...${r.txHash.slice(-6)}\`](https://explorer-studio.genlayer.com/tx/${r.txHash})`
      : r.txHash;
    console.log(`| ${r.step} | \`${r.function}\` | ${hashDisplay} | ${r.consensus} | \`${r.status}\` | ${r.latencySec}s | ${r.payload || r.error || 'N/A'} |`);
  });
}

run().catch((err) => {
  console.error('Fatal E2E execution failure:', err);
  process.exit(1);
});
