const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const COURT_ADDRESS = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';

async function main() {
  console.log('=== SDK & WRITE PROBE ON STUDIONET ===');
  
  // 1. Generate throwaway account
  const account = createAccount();
  console.log('Throwaway Account Address:', account.address);
  
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  // 2. Check balance (zero balance test)
  const balance = await client.getBalance({ address: account.address });
  console.log('Zero balance check:', balance.toString(), '(Gas price is 0 on Studionet)');

  // 3. Create a NEW test policy (owner == agent is fine or using account.address)
  // Text must be >= 30 chars and <= 1200 chars.
  const policyText = "Test policy for automated probe verification on Studionet: allows small cloud instances under 50.";
  console.log('\n--- 1. Testing create_policy ---');
  const t0 = Date.now();
  const createTxHash = await client.writeContract({
    address: COURT_ADDRESS,
    functionName: 'create_policy',
    args: [account.address, policyText, "50", "150"],
  });
  console.log('create_policy tx hash:', createTxHash);

  const createReceipt = await client.waitForTransactionReceipt({
    hash: createTxHash,
    retries: 60,
    interval: 3000,
  });
  const tCreate = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`create_policy receipt in ${tCreate}s: status=${createReceipt.status_name}, result=${createReceipt.result_name}`);

  // Retrieve new policy id via list_policies_by_owner
  const myPoliciesJson = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_policies_by_owner',
    args: [account.address, 10],
  });
  const myPolicies = JSON.parse(myPoliciesJson);
  console.log('Policies created by throwaway account:', myPolicies);
  if (!myPolicies || myPolicies.length === 0) {
    throw new Error('Failed to find created policy');
  }
  const testPolicyId = myPolicies[0].id;
  console.log('New Test Policy ID:', testPolicyId);

  // 4. Request action on test policy
  console.log('\n--- 2. Testing request_action (Deterministic HARD_LIMIT DENY) ---');
  const t1 = Date.now();
  const reqTxHash = await client.writeContract({
    address: COURT_ADDRESS,
    functionName: 'request_action',
    args: [testPolicyId, "cloud_ops", "100", "Attempt purchase exceeding max amount 50"],
  });
  console.log('request_action tx hash:', reqTxHash);
  const reqReceipt = await client.waitForTransactionReceipt({
    hash: reqTxHash,
    retries: 60,
    interval: 3000,
  });
  const tReq = ((Date.now() - t1) / 1000).toFixed(2);
  console.log(`request_action receipt in ${tReq}s: status=${reqReceipt.status_name}, result=${reqReceipt.result_name}`);

  // Check decision
  const latestDecId = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'latest_decision_id',
    args: [testPolicyId],
  });
  console.log('Latest Decision ID for test policy:', latestDecId);

  const decJson = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_decision',
    args: [latestDecId],
  });
  const dec = JSON.parse(decJson);
  console.log('Evaluated Decision:', dec);

  // 5. Save receipt fixtures for tests
  const fixturesDir = path.join(__dirname, '../src/data/fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });
  fs.writeFileSync(path.join(fixturesDir, 'create_policy_receipt.json'), JSON.stringify(createReceipt, null, 2));
  fs.writeFileSync(path.join(fixturesDir, 'request_action_receipt.json'), JSON.stringify(reqReceipt, null, 2));
  console.log('\nSaved receipt fixtures to src/data/fixtures/');

  return {
    account: account.address,
    testPolicyId,
    createReceipt,
    reqReceipt,
    dec,
  };
}

main().catch(err => {
  console.error('Probe failed:', err);
  process.exit(1);
});
