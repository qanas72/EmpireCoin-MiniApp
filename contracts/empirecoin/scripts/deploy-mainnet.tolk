import "@acton/emulation/scripts"
import "utils/common"
import "../contracts/storage"
import "../wrappers/JettonMinter.gen"

// Mainnet-only guard: the connected wallet must be the approved EMPC treasury.
fun main() {
    val deployer = promptJettonWallet("JETTON_DEPLOYER", "Connect EMPC Treasury Wallet");
    val treasury = empcTreasuryAddress();
    assert (deployer.address == treasury) throw 0xE201;

    val storage = empcMainnetMinterStorage(treasury);
    val minter = deployJettonMinter(deployer, storage);

    val data = minter.getJettonData();
    assert (data.totalSupply == 0) throw 0xE202;
    assert (data.mintable) throw 0xE203;
    assert (data.adminAddress != null) throw 0xE204;
    assert (data.adminAddress! == treasury) throw 0xE205;

    val metadata = OnchainMetadataReply.fromCell(data.jettonContent);
    assert (readOnchainMetadataField(metadata, "name".sha256()) != null) throw 0xE206;
    assert (readOnchainMetadataField(metadata, "symbol".sha256()) != null) throw 0xE207;
    assert (readOnchainMetadataField(metadata, "decimals".sha256()) != null) throw 0xE208;
    assert (readOnchainMetadataField(metadata, "image".sha256()) != null) throw 0xE209;

    printJettonMinterInfo(minter, "EMPC_MAINNET");
    printJettonWalletInfo(minter, treasury, "EMPC_TREASURY");
}
