import fs from 'node:fs';
import path from 'node:path';
import { createClient, createAccount, chains, generatePrivateKey } from 'genlayer-js';
const COURT_V2_ADDRESS = '0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b';
const VAULT_V2_ADDRESS = '0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58';

function getOrGenerateAccount(envVar, label) {
  let key = process.env[envVar];
  if (!key) {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`${envVar}\\s*=\\s*([^\\r\\n]+)`));
      if (match) key = match[1].trim();
    }
  }
  if (!key) {
    key = generatePrivateKey();
    console.log(`Generated new throwaway ${label} key`);
  }
  return { account: createAccount(key), privateKey: key };
}

async function run() {
  console.log('=== STARTING REAL ON-CHAIN E2E WRITE FLOW (V2 - STUDIONET 61999) ===\n');

  const { account: ownerAccount, privateKey: ownerKey } = getOrGenerateAccount('THROWAWAY_OWNER_KEY', 'Owner');
  const { account: agentAccount, privateKey: agentKey } = getOrGenerateAccount('THROWAWAY_AGENT_KEY', 'Agent');
  const { account: otherAccount, privateKey: otherKey } = getOrGenerateAccount('THROWAWAY_OTHER_KEY', 'Other');

  // Ensure keys in .env
  let envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  if (!envContent.includes('THROWAWAY_OWNER_KEY')) envContent += `\nTHROWAWAY_OWNER_KEY=${ownerKey}`;
  if (!envContent.includes('THROWAWAY_AGENT_KEY')) envContent += `\nTHROWAWAY_AGENT_KEY=${agentKey}`;
  if (!envContent.includes('THROWAWAY_OTHER_KEY')) envContent += `\nTHROWAWAY_OTHER_KEY=${otherKey}`;
  fs.writeFileSync('.env', envContent.trim() + '\n', 'utf8');

  console.log('Owner Account:', ownerAccount.address);
  console.log('Agent Account:', agentAccount.address);
  console.log('Other Account:', otherAccount.address);
  console.log('Court V2 Contract:', COURT_V2_ADDRESS);
  console.log('Vault V2 Contract:', VAULT_V2_ADDRESS);

  const ownerClient = createClient({ chain: chains.studionet, account: ownerAccount });
  const agentClient = createClient({ chain: chains.studionet, account: agentAccount });
  const otherClient = createClient({ chain: chains.studionet, account: otherAccount });

  const allowedRecipient = '0x1111111111111111111111111111111111111111';
  const unauthorizedRecipient = '0x9999999999999999999999999999999999999999';
  const allowedAsset = 'USDC';
  const unauthorizedAsset = 'DAI';
  const calldataHash = 'a'.repeat(64);

  const steps = [];

  async function executeStep(stepId, title, client, targetAddress, functionName, args, expectSuccess, expectedErrorSubstr) {
    console.log(`\n============================================================`);
    console.log(`[${stepId}] ${title}`);
    console.log(`Calling: ${functionName}(${args.map((a) => JSON.stringify(a)).join(', ')})`);
    console.log(`Target: ${targetAddress}`);

    const startTime = Date.now();
    let txHash = '';
    let receipt = null;
    let latencySec = 0;
    let payload = '';
    let status = '';
    let consensus = '';
    let execResult = '';
    let isSuccess = false;
    let errorMessage = null;

    try {
      txHash = await client.writeContract({
        address: targetAddress,
        functionName,
        args,
        value: 0n,
      });
      console.log(`  -> Broadcast Tx: ${txHash}`);
      console.log(`  -> Waiting for Studionet multi-validator consensus (retries: 120, interval: 3000ms)...`);

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          receipt = await client.waitForTransactionReceipt({
            hash: txHash,
            interval: 3000,
            retries: 120,
          });
          break;
        } catch (waitErr) {
          if (attempt === 2) throw waitErr;
          console.log(`  -> Transient RPC poll error (${waitErr.message}), retrying attempt ${attempt + 2}...`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      latencySec = Number(((Date.now() - startTime) / 1000).toFixed(2));
      status = receipt.status_name || (receipt.status === 5 ? 'ACCEPTED' : String(receipt.status));
      consensus = receipt.result_name || 'UNKNOWN';
      const leader = receipt.consensus_data?.leader_receipt?.[0];
      execResult = leader?.execution_result || 'UNKNOWN';

      if (leader?.result?.payload) {
        payload = leader.result.payload.readable || JSON.stringify(leader.result.payload);
      } else if (leader?.genvm_result?.error_description) {
        payload = leader.genvm_result.error_description;
      }

      const statusValid = status === 'ACCEPTED' || status === 'FINALIZED';
      const resultValid = consensus === 'MAJORITY_AGREE' || consensus === 'FINALIZED';
      const execValid = execResult === 'SUCCESS';

      isSuccess = statusValid && resultValid && execValid;

      console.log(`  -> Status: ${status}, Consensus: ${consensus}, Leader: ${execResult}, Latency: ${latencySec}s`);
      console.log(`  -> Payload: ${payload}`);

      if (!isSuccess && execResult === 'ERROR') {
        errorMessage = payload;
      }
    } catch (err) {
      latencySec = Number(((Date.now() - startTime) / 1000).toFixed(2));
      console.log(`  -> Exception / Revert caught: ${err.message}`);
      errorMessage = err.message;
      isSuccess = false;
    }

    const passedExpectation = expectSuccess ? isSuccess : (!isSuccess || (errorMessage && (!expectedErrorSubstr || errorMessage.includes(expectedErrorSubstr))));
    console.log(`  -> Step Verification: ${passedExpectation ? 'PASS' : 'FAIL'}`);

    const record = {
      stepId,
      title,
      targetAddress,
      functionName,
      args,
      txHash,
      status,
      consensus,
      execResult,
      latencySec,
      payload,
      isSuccess,
      errorMessage,
      expectedSuccess: expectSuccess,
      passedExpectation,
      rawReceipt: receipt,
    };
    steps.push(record);
    return { record, payload, isSuccess };
  }

  // 1. Create Policy with Allowlists (Owner)
  console.log('\n--- STEP 1: CREATE POLICY WITH ALLOWLISTS ---');
  const policyText = 'The agent may purchase cloud computing infrastructure renewals up to limits. Disallow gifts and unauthorized vendors.';
  const p1Res = await executeStep(
    'step_01_create_policy',
    'Create policy with allowlists (Owner)',
    ownerClient,
    COURT_V2_ADDRESS,
    'create_policy',
    [
      agentAccount.address,
      policyText,
      '100', // max_amount
      '300', // window_cap
      JSON.stringify([allowedRecipient.toLowerCase()]),
      JSON.stringify([allowedAsset]),
    ],
    true
  );

  let createdPolicyId = '1';
  try {
    const rawVal = JSON.parse(p1Res.payload);
    if (rawVal) createdPolicyId = String(rawVal);
  } catch {
    if (p1Res.payload) createdPolicyId = String(p1Res.payload).replace(/"/g, '');
  }
  console.log(`Created Policy ID: ${createdPolicyId}`);

  // 2. Request action within policy bounds (Agent) -> JUDGE
  console.log('\n--- STEP 2: REQUEST ACTION (IN BOUNDS -> JUDGE) ---');
  const reqClean = await executeStep(
    'step_02_request_in_bounds',
    'Request action in scope (Agent -> JUDGE)',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '40',
      calldataHash,
      'Renewal of monthly cloud instances for compute nodes',
    ],
    true
  );

  let cleanDecisionId = '1';
  try {
    const rawVal = JSON.parse(reqClean.payload);
    if (rawVal) cleanDecisionId = String(rawVal);
  } catch {
    if (reqClean.payload) cleanDecisionId = String(reqClean.payload).replace(/"/g, '');
  }

  // 3. Request action exceeding Hard Limit (Agent) -> HARD_LIMIT DENY
  console.log('\n--- STEP 3: HARD LIMIT REJECTION (Amount > max_amount) ---');
  await executeStep(
    'step_03_hard_limit_guard',
    'Hard limit deterministic guard (amount 150 > max 100)',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '150',
      calldataHash,
      'High capacity instance allocation exceeding single action cap',
    ],
    true
  );

  // 4. Request action with unauthorized recipient -> RECIPIENT_GUARD DENY
  console.log('\n--- STEP 4: RECIPIENT GUARD REJECTION ---');
  await executeStep(
    'step_04_recipient_guard',
    'Recipient allowlist guard (unauthorized address)',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      unauthorizedRecipient,
      allowedAsset,
      '30',
      calldataHash,
      'Attempt to route transfer to non-allowlisted address',
    ],
    true
  );

  // 5. Request action with unauthorized asset -> ASSET_GUARD DENY
  console.log('\n--- STEP 5: ASSET GUARD REJECTION ---');
  await executeStep(
    'step_05_asset_guard',
    'Asset allowlist guard (unauthorized token symbol)',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      unauthorizedAsset,
      '30',
      calldataHash,
      'Attempt spend in unauthorized token asset',
    ],
    true
  );

  // 6. Pause Policy (Owner) then request action (Agent) -> should revert 'policy is paused'
  console.log('\n--- STEP 6: PAUSE POLICY & VERIFY BLOCKED ---');
  await executeStep(
    'step_06a_pause_policy',
    'Pause policy (Owner)',
    ownerClient,
    COURT_V2_ADDRESS,
    'set_paused',
    [createdPolicyId, true],
    true
  );

  await executeStep(
    'step_06b_request_while_paused',
    'Request action while paused (expect UserError: policy is paused)',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '20',
      calldataHash,
      'Action requested while policy is locked in paused state',
    ],
    false,
    'policy is paused'
  );

  // 7. Unpause Policy (Owner)
  console.log('\n--- STEP 7: UNPAUSE POLICY ---');
  await executeStep(
    'step_07_unpause_policy',
    'Unpause policy (Owner)',
    ownerClient,
    COURT_V2_ADDRESS,
    'set_paused',
    [createdPolicyId, false],
    true
  );

  // 7b. Request ambiguous action to trigger model escalation (Agent)
  console.log('\n--- STEP 7B: REQUEST AMBIGUOUS ACTION (ESCALATE) ---');
  const reqEsc = await executeStep(
    'step_07b_request_escalation',
    'Request ambiguous action triggering LLM ESCALATE',
    agentClient,
    COURT_V2_ADDRESS,
    'request_action',
    [
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '45',
      calldataHash,
      'Developer conference attendance pass with team meal vouchers and gifts',
    ],
    true
  );

  let escDecisionId = '';
  try {
    const rawVal = JSON.parse(reqEsc.payload);
    if (rawVal) escDecisionId = String(rawVal);
  } catch {
    if (reqEsc.payload) escDecisionId = String(reqEsc.payload).replace(/"/g, '');
  }

  // 7c. Owner resolves the escalation to ALLOW
  if (escDecisionId) {
    console.log(`\n--- STEP 7C: OWNER RESOLVES ESCALATION #${escDecisionId} ---`);
    await executeStep(
      'step_07c_resolve_escalation',
      'Resolve escalation as ALLOW (Owner)',
      ownerClient,
      COURT_V2_ADDRESS,
      'resolve_escalation',
      [escDecisionId, 'ALLOW'],
      true
    );
  }

  // 8. Test is_cleared_for view query on cleanDecisionId
  console.log('\n--- STEP 8: VIEW QUERY is_cleared_for ---');
  const viewClient = createClient({ chain: chains.studionet });
  const exactCleared = await viewClient.readContract({
    address: COURT_V2_ADDRESS,
    functionName: 'is_cleared_for',
    args: [
      cleanDecisionId,
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '40',
      calldataHash,
    ],
  });
  console.log(`is_cleared_for exact parameters: ${exactCleared}`);

  const tamperedCleared = await viewClient.readContract({
    address: COURT_V2_ADDRESS,
    functionName: 'is_cleared_for',
    args: [
      cleanDecisionId,
      createdPolicyId,
      'cloud_ops',
      allowedRecipient,
      allowedAsset,
      '41', // tampered amount
      calldataHash,
    ],
  });
  console.log(`is_cleared_for tampered amount (41 vs 40): ${tamperedCleared}`);

  steps.push({
    stepId: 'step_08_is_cleared_for_view',
    title: 'is_cleared_for Action-bound Verification',
    exactMatchResult: Boolean(exactCleared),
    tamperedResult: Boolean(tamperedCleared),
    passedExpectation: Boolean(exactCleared) === true && Boolean(tamperedCleared) === false,
  });

  // 9. GuardedVaultV2 Execute & Replay Protection
  console.log('\n--- STEP 9: GUARDED VAULT EXECUTION & REPLAY ---');
  if (Boolean(exactCleared)) {
    const vExec = await executeStep(
      'step_09a_vault_execute',
      'Execute cleared decision on GuardedVaultV2',
      ownerClient,
      VAULT_V2_ADDRESS,
      'execute',
      [
        cleanDecisionId,
        createdPolicyId,
        'cloud_ops',
        allowedRecipient,
        allowedAsset,
        '40',
        calldataHash,
      ],
      true
    );

    // Replay attempt
    await executeStep(
      'step_09b_vault_replay',
      'Replay execution attempt (expect UserError: decision has already been executed)',
      ownerClient,
      VAULT_V2_ADDRESS,
      'execute',
      [
        cleanDecisionId,
        createdPolicyId,
        'cloud_ops',
        allowedRecipient,
        allowedAsset,
        '40',
        calldataHash,
      ],
      false,
      'decision has already been executed'
    );
  } else {
    console.log('Skipping vault execution because decision was not CLEARED (e.g. escalated by model)');
  }

  // Save evidence
  const evidenceOut = {
    timestamp: new Date().toISOString(),
    network: 'GenLayer Studionet (61999)',
    courtAddress: COURT_V2_ADDRESS,
    vaultAddress: VAULT_V2_ADDRESS,
    owner: ownerAccount.address,
    agent: agentAccount.address,
    other: otherAccount.address,
    policyId: createdPolicyId,
    cleanDecisionId,
    steps,
  };

  const outPath = path.resolve('docs/E2E_V2_EVIDENCE.json');
  fs.writeFileSync(outPath, JSON.stringify(evidenceOut, null, 2), 'utf8');
  console.log(`\n=== E2E FLOW COMPLETED: Saved raw evidence to ${outPath} ===`);
}

run().catch((err) => {
  console.error('E2E script crashed:', err);
  process.exit(1);
});
