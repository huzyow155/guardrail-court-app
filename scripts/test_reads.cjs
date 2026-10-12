const { createClient, chains } = require('genlayer-js');

const client = createClient({ chain: chains.studionet });
const COURT_ADDRESS = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';

async function main() {
  console.log('Testing readContract with string arguments...');
  try {
    const policy1 = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'get_policy',
      args: ['1']
    });
    console.log('get_policy("1"):', policy1);

    const stats1 = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'get_policy_stats',
      args: ['1']
    });
    console.log('get_policy_stats("1"):', stats1);

    const isCleared1 = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'is_cleared',
      args: ['1']
    });
    console.log('is_cleared("1"):', isCleared1);

    const dec1 = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'get_decision',
      args: ['1']
    });
    console.log('get_decision("1"):', dec1);

    const pending = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'pending_escalations',
      args: ['1']
    });
    console.log('pending_escalations("1"):', pending);

    const count = await client.readContract({
      address: COURT_ADDRESS,
      functionName: 'get_policy_count',
      args: []
    });
    console.log('get_policy_count():', count);

  } catch (err) {
    console.error('Error:', err);
    if (err.cause?.data?.genvm_result?.stderr) {
      console.error('GenVM stderr:', err.cause.data.genvm_result.stderr);
    }
  }
}

main();
