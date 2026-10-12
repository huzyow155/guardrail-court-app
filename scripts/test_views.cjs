const { createClient, chains } = require('genlayer-js');

const client = createClient({ chain: chains.studionet });
const COURT_ADDRESS = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';

async function testMethods() {
  console.log('Testing all view methods...');

  const p1 = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_policy',
    args: ['1']
  });
  console.log('[OK] get_policy("1"): id =', JSON.parse(p1).id);

  const stats = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_policy_stats',
    args: ['1']
  });
  console.log('[OK] get_policy_stats("1"): total =', JSON.parse(stats).total_decisions);

  const decs = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_decisions',
    args: ['1', 10]
  });
  console.log('[OK] list_decisions("1", 10): count =', JSON.parse(decs).length);

  const pend = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'pending_escalations',
    args: ['1']
  });
  console.log('[OK] pending_escalations("1"): count =', JSON.parse(pend).length);

  const latest = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'latest_decision_id',
    args: ['1']
  });
  console.log('[OK] latest_decision_id("1"):', latest);

  const cleared = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'is_cleared',
    args: ['1']
  });
  console.log('[OK] is_cleared("1"):', cleared);

  const owner = JSON.parse(p1).owner;
  const byOwner = await client.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_policies_by_owner',
    args: [owner, 10]
  });
  console.log('[OK] list_policies_by_owner:', JSON.parse(byOwner).length);
}

testMethods().catch(e => {
  console.error('Error:', e);
  if (e.cause?.data?.genvm_result?.stderr) console.error('Stderr:', e.cause.data.genvm_result.stderr);
});
