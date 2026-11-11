# EmpireCoin economy implementation status

Last updated: 2026-11-11

This document tracks the independent EmpireCoin (EMPC) project. It is not the older EMPIRE website's internal economy.

## Owner-approved tokenomics

- Network: TON Jetton
- Fixed total supply target: 1,000,000,000 EMPC
- Distribution model: mixed
- Listing objective: TON DEX first, then pursue CEX applications
- Minting: one initial mint, then irreversible minter-admin removal only after owner review and explicit approval

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

The user-reward allocation is subdivided as follows:

- Mining: 240,000,000 EMPC
- Tasks: 60,000,000 EMPC
- Referrals: 40,000,000 EMPC
- Campaigns and events: 30,000,000 EMPC
- Community and content: 20,000,000 EMPC
- Special rewards: 10,000,000 EMPC

## Dynamic mining plan

The 240,000,000 EMPC mining allocation is budgeted over five annual epochs:

| Epoch | Annual budget |
|---|---:|
| 1 | 72,000,000 EMPC |
| 2 | 60,000,000 EMPC |
| 3 | 48,000,000 EMPC |
| 4 | 36,000,000 EMPC |
| 5 | 24,000,000 EMPC |

Daily budgets are derived from the exact calendar length of each epoch, including leap years. A daily budget is a maximum, not a promise to distribute the full amount. Unused amounts remain unspent; missed user claim cycles do not roll forward.

The planned allocation formula is proportional to verified activity weight:

`user_reward = min(daily_budget * user_weight / total_verified_weight, per_user_daily_cap, remaining_pool_budget)`

The existing private setting for the per-user daily cap is 6 EMPC. It remains a safety cap and must be reviewed before public launch.

## Implemented backend foundation

Supabase private-schema tables created:

- `empc_token_allocations`
- `empc_mining_epochs`
- `empc_balances`
- `empc_ledger`
- `empc_mining_activity`
- `empc_mining_daily_pools`
- `empc_mining_user_snapshots`
- `empc_mining_claims`
- `empc_reward_suballocations` (mining/tasks/referrals/campaigns/community/special reward caps)
- `empc_tasks` and `empc_task_submissions`
- `empc_referrals` and `empc_referral_rewards`

The EMPC ledger is append-only. Corrections must be recorded as reversing/new entries, never by editing historical ledger rows.

Server-only functions and Edge Function:

- `private.prepare_empc_mining_pool(date)`: prepares a completed activity day using a frozen weight snapshot.
- `private.claim_empc_mining_reward(telegram_user_id,date)`: performs the reward, ledger, balance and pool updates atomically.
- `public.empc_mining_status(telegram_user_id)`: service-role-only status API.
- `public.empc_claim_mining_reward(telegram_user_id)`: service-role-only claim API.
- Edge Function `empc-mining`: validates Telegram Web App initData and exposes status/claim operations.

Private schema access is restricted to the trusted service role. The two wallet RPC functions flagged during the initial security review were also restricted to service-role execution.

## Current launch gates

Mining and referrals remain disabled. The backend foundation is not yet a public reward programme.

Still required before enabling mining:
1. Implement trusted activity ingestion for daily check-ins and verified tasks.
2. Add a reliable daily scheduler to freeze completed-day activity pools.
3. Add automated tests for duplicate claims, concurrent claims, cap enforcement, budget exhaustion, and missed cycles.
4. Integrate the final reward status/claim UX in the Telegram Mini App.
5. Perform a security review of the complete reward flow and admin controls.

Still required before real token launch:
1. Complete public Testnet deployment and end-to-end Jetton wallet/transfer tests.
2. Verify metadata, master contract, mintability, supply and treasury balances on-chain.
3. Obtain an independent security review.
4. Prepare vesting/lock arrangements and allocation wallet disclosures.
5. Owner review and explicit approval for Mainnet deployment, initial mint and irreversible mint-admin removal.

No Mainnet deployment, initial mint, token sale, liquidity pool, or real EMPC withdrawal is activated by the work described here.
