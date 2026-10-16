export const DEPLOYMENTS = {
  v2: {
    court: {
      address: '0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b',
      deployTx: '0x9010b9b20c6b21e0e980ac896a9f28708a195c419b5c8eca9b05426b4defab1b',
      sha256: '94BDA609903A2ECC854269307E628E49869A36B466DAE7CD941553406E12F9F6',
      name: 'GuardrailCourtV2',
      status: 'Active',
    },
    vault: {
      address: '0xc0dF70EE8BEC7003EF6CCfb24590b4D559699b58',
      deployTx: '0x7df07e95b5a20203845c23deb42e4e38724dc522b54be6b0101deb811ea1eb94',
      sha256: '7CB69D7745B0C9354ECA3D1D712EBF7099726298128C3C45E54F8C7CC2060366',
      name: 'GuardedVaultV2',
      status: 'Active',
    },
  },
  legacy: {
    court: {
      address: '0x6C553Ba27a768D71b570a106D9D2e13553b4103c',
      sha256: 'DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC',
      name: 'GuardrailCourt',
      status: 'superseded',
    },
    vault: {
      address: '0xc3B3Ea32C3B74cD17Ab00E175B6D34ce1c9dbc2C',
      sha256: '34844351BD7B484E56E1A55425B73166803B8C3C3277E2F915BBE5BDEFB4D866',
      name: 'GuardedVault',
      status: 'superseded',
    },
  },
} as const;

export const COURT_V2_ADDRESS = DEPLOYMENTS.v2.court.address;
export const VAULT_V2_ADDRESS = DEPLOYMENTS.v2.vault.address;

export const ACTIVE_COURT_ADDRESS = COURT_V2_ADDRESS;
export const ACTIVE_VAULT_ADDRESS = VAULT_V2_ADDRESS;
