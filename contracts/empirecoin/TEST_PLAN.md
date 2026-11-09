# EmpireCoin Testnet acceptance tests

These tests must pass before any Mainnet deployment is considered.

## Supply and decimals
- Metadata reports name `EmpireCoin`, symbol `EMPC`, decimals `9`.
- Exactly 1,000,000,000 EMPC equals 1,000,000,000,000,000,000 indivisible units.
- After initial mint, master `total_supply` is exactly 10^18 base units.
- No mint operation can make total supply exceed 10^18.

## Authority and permanent mint closure
- A non-admin cannot mint.
- The designated Testnet admin can perform the one initial mint.
- Before admin removal, verify recipient, amount, decimals, metadata, and total supply.
- After `drop_admin`, `mintable` is false and `admin_address` is null.
- A mint attempt after admin removal fails permanently.
- Admin transfer, metadata update, and code upgrade are unavailable after admin removal.

## Jetton behavior
- Each owner gets the correct deterministic Jetton wallet address.
- Transfers between wallets work and balances reconcile.
- User-initiated burns reduce wallet balance and master total supply correctly.
- Invalid wallet messages and fake wallet addresses are rejected.
- Bounce handling restores supply/balances correctly.
- Wallet discovery follows TEP-89 behavior.
- Metadata follows TEP-64.

## Deployment safeguards
- Tests run on local emulator before Testnet.
- Testnet deployment uses a dedicated test wallet only.
- Record minter address, wallet addresses, transaction hashes, build version, and test results.
- Do not publish or activate Mainnet payments until the Mainnet contract is reviewed and verified.
