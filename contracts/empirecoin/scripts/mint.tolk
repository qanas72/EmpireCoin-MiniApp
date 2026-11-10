import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "utils/common"
import "../contracts/storage"
import "../wrappers/JettonMinter.gen"
import "../wrappers/utils"

const EMPC_TOTAL_SUPPLY_BASE_UNITS = 1000000000000000000

fun main() {
    val admin = promptJettonWallet("JETTON_ADMIN", "Select Jetton Admin ActonWallet");
    val minter = promptJettonMinter("Enter Jetton Minter address");
    val treasury = empcTreasuryAddress();
    assert (admin.address == treasury) throw 0xE110;
    val recipient = promptJettonAddress(
        "JETTON_MINT_RECIPIENT",
        "Confirm EMPC treasury recipient",
        treasury,
    );
    val mintAmount = promptJettonCoins(
        "JETTON_MINT_AMOUNT",
        "Confirm exact total supply in base units",
        "1000000000000000000",
    );

    // Refuse to mint unless this is a fresh minter controlled by the selected admin.
    val before = minter.getJettonData();
    assert (before.totalSupply == 0) throw 0xE101;
    assert (before.mintable) throw 0xE102;
    assert (before.adminAddress != null) throw 0xE103;
    assert (before.adminAddress! == admin.address) throw 0xE104;
    assert (recipient == treasury) throw 0xE105;
    assert (mintAmount == EMPC_TOTAL_SUPPLY_BASE_UNITS) throw 0xE106;

    val metadata = OnchainMetadataReply.fromCell(before.jettonContent);
    val name = readOnchainMetadataField(metadata, "name".sha256());
    val symbol = readOnchainMetadataField(metadata, "symbol".sha256());
    val decimals = readOnchainMetadataField(metadata, "decimals".sha256());
    assert (name != null) throw 0xE107;
    assert (symbol != null) throw 0xE109;
    assert (decimals != null) throw 0xE10B;

    val res = minter.sendMint(admin.address, recipient, mintAmount, 1, grams("0.08"));
    res.waitForFirstTransaction();

    val after = minter.getJettonData();
    assert (after.totalSupply == EMPC_TOTAL_SUPPLY_BASE_UNITS) throw 0xE10D;
    assert (after.adminAddress != null) throw 0xE10E;
    assert (after.adminAddress! == admin.address) throw 0xE10F;

    printJettonMinterInfo(minter, "EMPC_MINTED");
    printJettonWalletInfo(minter, recipient, "EMPC_TREASURY");
}
