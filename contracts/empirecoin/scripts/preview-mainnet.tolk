import "@acton/io"
import "utils/common"
import "../wrappers/JettonMinter.gen"

// Deterministic, offline preview only. This script never broadcasts a transaction.
fun main() {
    val treasury = empcTreasuryAddress();
    val minter = JettonMinter.fromStorage(empcMainnetMinterStorage(treasury));

    println("NETWORK=TON_MAINNET");
    println("MINTER_ADDRESS={}", minter.address);
    println("DEPLOYER_AND_ADMIN={}", treasury);
    println("INITIAL_TOTAL_SUPPLY=0");
    println("NAME=EmpireCoin");
    println("SYMBOL=EMPC");
    println("DECIMALS=9");
    println("IMAGE={}", "https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-icon.png");
    println("DEPLOY_CONTRACT_VALUE=0.05 TON");
}
