# EmpireCoin (EMPC) — TON Jetton workspace

This is the independent EmpireCoin token project. It is separate from the older EMPIRE website economy and its Supabase balances.

## Approved token parameters

- Name: EmpireCoin
- Symbol: EMPC
- Network: TON
- Standard: Jetton TEP-74, metadata TEP-64, wallet discovery TEP-89
- Decimals: 9
- Fixed total supply: 1,000,000,000 EMPC
- Initial supply in base units: `1000000000000000000` (10^18)
- Minting: one initial mint; then permanently disable minting by removing the minter admin in a separate irreversible transaction.

## Contract implementation

The contract is based on the official TON Blockchain Acton Jetton v2.1 Tolk implementation, vendored from `ton-blockchain/acton-contracts` commit `d721c3179696b453a9490fcfd2f30770f8c234b4`. The upstream MIT license is included in `UPSTREAM-LICENSE.txt`.

## Verification status

GitHub Actions has successfully completed:
- Contract build
- Jetton test suite
- Local deployment-script emulation
- Mainnet address preview
- Static checks and formatting

The deterministic Mainnet preview is documented in [MAINNET-DEPLOYMENT.md](./MAINNET-DEPLOYMENT.md). The preview address is only valid for the exact contract code, admin address, and metadata used by that preview. Re-run the preview after changing any of those inputs.

**No Testnet or Mainnet deployment transaction has been submitted.** The project has no live Jetton master address yet. CI emulation is not a substitute for a public Testnet deployment or an independent security audit.

## Deployment

Follow [MAINNET-DEPLOYMENT.md](./MAINNET-DEPLOYMENT.md). The Mainnet deployment script:
- accepts the treasury wallet through TON Connect, without exposing a seed phrase;
- refuses to deploy unless the connected wallet matches the configured treasury;
- fixes the initial on-chain supply at zero;
- fixes the token name, symbol, decimals, description, and image.

The initial mint is a separate transaction. Admin removal is also separate and irreversible. Never run it until the minted supply, metadata, and recipient balance have been verified and the owner has explicitly approved the lock.

Acton recommends at least 1 TON available for public-network deployment. The deploy script sends 0.05 TON as the contract deployment message value; actual network fees are additional and may vary.

## Approved token allocation (November 2026)

The owner-approved mixed allocation replaces all earlier draft allocation tables:

| Allocation | Share | EMPC |
|---|---:|---:|
| User rewards and mining | 40% | 400,000,000 |
| Treasury and ecosystem development | 15% | 150,000,000 |
| DEX liquidity | 15% | 150,000,000 |
| Team and technical development | 10% | 100,000,000 |
| Marketing and community growth | 8% | 80,000,000 |
| Commercial partnerships | 7% | 70,000,000 |
| Security and emergency reserve | 5% | 50,000,000 |
| **Total** | **100%** | **1,000,000,000** |

The 400,000,000 EMPC user-reward allocation is subdivided in the approved economic plan into 240,000,000 mining, 60,000,000 tasks, 40,000,000 referrals, 30,000,000 campaigns/events, 20,000,000 community/content activity, and 10,000,000 special-reward reserve. Mining uses a dynamic, server-calculated reward model with a five-year budget plan; unclaimed 24-hour cycles do not accrue.

Allocation is not the same as immediate release or distribution. The initial mint destination, vesting/lock contracts, allocation wallet addresses, and transfers must be separately reviewed and confirmed before any on-chain distribution. Earlier 700,000,000 EMPC treasury-balance proposals and the previous draft allocation table are superseded for this independent token project.

## Safety

- Never place seed phrases, private keys, bot tokens, or API secrets in the repository.
- Use TON Connect for wallet approval; do not import or paste a Mainnet seed phrase into another wallet or website.
- Do not enable token deposits, sales, or withdrawals in the Mini App until on-chain verification and accounting have been independently tested.
- Never run `scripts/drop-admin.tolk` without a separate, explicit approval after checking the exact on-chain state.
