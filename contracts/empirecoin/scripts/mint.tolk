import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "utils/common"
import "../wrappers/utils"

const EMPC_TREASURY_ADDRESS = "UQBGbzaKDO0j_gddN5qguj15BrI6L9_VGcnUT0xP6rGXK7KT"
const EMPC_TOTAL_SUPPLY_BASE_UNITS = 1000000000000000000

fun main() {
    val admin = promptJettonWallet("JETTON_ADMIN", "Select Jetton Admin ActonWallet");
    val minter = promptJettonMinter("Enter Jetton Minter address");
    val treasury = parseAddress(EMPC_TREASURY_ADDRESS);
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
    assert (
        readOnchainMetadataField(metadata, "name".sha256()) == "EmpireCoin"
    ) throw 0xE107;
    assert (
        readOnchainMetadataField(metadata, "symbol".sha256()) == "EMPC"
    ) throw 0xE108;
    assert (
        readOnchainMetadataField(metadata, "decimals".sha256()) == "9"
    ) throw 0xE109;

    val res = minter.sendMint(admin.address, recipient, mintAmount, 1, grams("0.08"));
    res.waitForFirstTransaction();

    val after = minter.getJettonData();
    assert (after.totalSupply == EMPC_TOTAL_SUPPLY_BASE_UNITS) throw 0xE10A;
    assert (after.adminAddress != null) throw 0xE10B;
    assert (after.adminAddress! == admin.address) throw 0xE10C;

    printJettonMinterInfo(minter, "EMPC_MINTED");
    printJettonWalletInfo(minter, recipient, "EMPC_TREASURY");
}
