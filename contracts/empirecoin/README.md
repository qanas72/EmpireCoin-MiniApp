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

## Allocation plan

| Allocation | EMPC |
|---|---:|
| Treasury | 200,000,000 |
| Free user earnings | 150,000,000 |
| Referrals | 100,000,000 |
| Tasks and advertising rewards | 150,000,000 |
| Token sale | 200,000,000 |
| Liquidity | 100,000,000 |
| Long-term reserve | 100,000,000 |
| **Total** | **1,000,000,000** |

The allocation table is the approved plan; it does not automatically distribute tokens. The initial mint goes to the treasury wallet. Separate destination wallets and transfers must be confirmed before allocations are distributed.

## Safety

- Never place seed phrases, private keys, bot tokens, or API secrets in the repository.
- Use TON Connect for wallet approval; do not import or paste a Mainnet seed phrase into another wallet or website.
- Do not enable token deposits, sales, or withdrawals in the Mini App until on-chain verification and accounting have been independently tested.
- Never run `scripts/drop-admin.tolk` without a separate, explicit approval after checking the exact on-chain state.
