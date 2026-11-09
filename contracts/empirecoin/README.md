# EmpireCoin (EMPC) — TON Jetton workspace

This directory is the isolated smart-contract workspace for the independent EmpireCoin project. It is separate from the EMPIRE website economy and its Supabase balances.

## Approved token parameters

- Name: EmpireCoin
- Symbol: EMPC
- Network: TON
- Standard: TON Jetton (TEP-74), metadata TEP-64, wallet discovery TEP-89
- Decimals: 9
- Fixed total supply: 1,000,000,000 EMPC
- Smallest unit: 0.000000001 EMPC
- Initial supply in base units: 1,000,000,000,000,000,000 (10^18)
- Post-launch minting: permanently disabled after the initial mint by dropping the minter admin.

## Contract baseline

Use the official TON Blockchain Acton Jetton v2.1 Tolk implementation as the baseline, not a hand-written token implementation:
https://github.com/ton-blockchain/acton-contracts/tree/master/jetton-v2.1

The upstream Tolk source, wrappers, scripts, and tests are vendored from `ton-blockchain/acton-contracts` commit `d721c3179696b453a9490fcfd2f30770f8c234b4` (Acton 1.2.0 baseline). The upstream MIT license is included as `UPSTREAM-LICENSE.txt`.

## Important deployment design

1. Build and run the contract tests locally/emulator first. The current GitHub Actions run passed build, all tests, static checks, and formatting: https://github.com/qanas72/EmpireCoin-MiniApp/actions/runs/42617222050.
2. Deploy only to TON Testnet with a dedicated test wallet. Do not use the production treasury wallet for tests.
3. Mint exactly 10^18 base units on Testnet, then test that the supply is correct.
4. Test unauthorized mint rejection.
5. Test dropping the admin, then verify `mintable = false`, `admin_address = null`, and all later mint attempts fail. A project regression test now checks that a mint attempt after admin removal fails and total supply remains unchanged.
6. Test wallet derivation, transfers, burns, bounce handling, and metadata.
7. Only after independent review and successful Testnet tests, prepare a separate Mainnet deployment. Mainnet requires a fresh explicit owner approval and a funded wallet transaction.

Dropping the admin is irreversible in the standard contract. Do not drop it until the exact supply, metadata, and initial recipient have been checked.

## Allocation plan (whole EMPC)

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

The initial mint recipient and subsequent allocation wallets must be confirmed before any deployment. The allocation table is a plan; it does not itself distribute tokens.

## Current status

- Contract source and upstream test suite are in the repository.
- Testnet deployment has **not** been performed.
- No EMPC Jetton has been deployed on TON Mainnet; there is no live token contract address yet.
- The fixed supply is achieved by minting exactly `10^18` base units once and immediately dropping the minter admin. Until that irreversible lock is confirmed on-chain, the admin can still mint; protect the admin key and do not distribute tokens early.

## Safety

- Never place seed phrases, private keys, bot tokens, or API secrets in this repository.
- Never deploy the testnet build to Mainnet.
- Do not enable in-app token deposits, sales, or withdrawals until transaction verification and accounting are independently tested.
- The current treasury address is intentionally not embedded in source/config files.
