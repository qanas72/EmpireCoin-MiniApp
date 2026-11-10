# EMPC Mainnet deployment runbook

## Current verified deployment preview

This preview is for the contract source and metadata at commit `5381d453e46bdcebdc5ba5edc11bc09ed1bcad12`.

- Network: TON Mainnet
- Predicted Jetton master: `kQBk4ULKNtMpHyR9WjMa7VuVsTTz7Iu-kEblicjFWjx80SoI`
- Treasury / minter admin: `UQBGbzaKDO0j_gddN5qguj15BrI6L9_VGcnUT0xP6rGXK7KT`
- Name / symbol: EmpireCoin / EMPC
- Decimals: 9
- Supply at deployment: 0 EMPC
- Deployment contract message value: 0.05 TON, plus wallet/network fees
- Initial mint is a separate transaction for exactly 1,000,000,000 EMPC.
- Admin removal is a separate, irreversible transaction and must not be run until supply and metadata are independently checked.

The predicted address is deterministic for this exact contract code, admin address, and metadata. Re-run `acton script scripts/preview-mainnet.tolk` after any change to these inputs.

## Prepare the private Codespace

1. Open the repository: https://github.com/qanas72/EmpireCoin-MiniApp
2. Choose **Code → Codespaces → Create codespace on main**.
3. Wait for the existing Dev Container to install Acton 1.2.1.
4. In the terminal, run:

   ```bash
   cd contracts/empirecoin
   acton --version
   acton build
   acton test tests
   acton check
   acton fmt --check
   acton script scripts/preview-mainnet.tolk
   ```

5. Confirm the previewed minter address matches the address above.

## Mainnet deployment (one transaction only)

Only after the owner has checked the connected wallet, network, predicted contract address, and available balance:

```bash
cd contracts/empirecoin
acton script scripts/deploy-mainnet.tolk --net mainnet --tonconnect --explorer actonscan
```

Acton opens a TON Connect QR code and a `tc://` link. Connect the approved treasury wallet. The script refuses to deploy if the connected wallet is not the treasury address. The wallet approval screen must show TON Mainnet and the contract deployment; the contract message value is 0.05 TON, with network fees additional. Acton documentation recommends at least 1 TON available for public-network deployment.

Do not share seed phrases or private keys. Do not approve any transaction whose network, wallet, destination, or amount differs from the values above.

## After deployment

1. Save the actual minter address and deployment transaction hash.
2. Inspect the minter on Actonscan and verify the admin, metadata, and zero supply.
3. Only then prepare the separate initial mint transaction for exactly 1,000,000,000 EMPC to the treasury.
4. Verify the total supply and treasury Jetton wallet balance.
5. Do not run `scripts/drop-admin.tolk` until the owner has reviewed the on-chain state and explicitly approved that irreversible action.

## Safety notes

- The test suite and emulator CI are successful, but this is not a substitute for a public Testnet deployment or an independent security audit.
- The project has not yet been deployed to Testnet or Mainnet.
- No Mainnet transaction has been submitted or approved.
