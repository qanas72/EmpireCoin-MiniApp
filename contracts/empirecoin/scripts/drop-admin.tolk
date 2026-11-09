import "@acton/emulation/network"
import "@acton/emulation/scripts"
import "utils/common"
import "../wrappers/JettonMinter.gen"
import "../wrappers/utils"

// This is intentionally a separate, irreversible finalization step.
// Run only after verifying the full fixed supply and all metadata on-chain.
fun main() {
    val admin = promptJettonWallet("JETTON_ADMIN", "Select Current Jetton Admin ActonWallet");
    val minter = promptJettonMinter("Enter Jetton Minter address");

    val before = minter.getJettonData();
    assert (before.totalSupply == 1000000000000000000) throw 0xE001;
    assert (before.mintable) throw 0xE002;
    assert (before.adminAddress != null) throw 0xE003;
    assert (before.adminAddress! == admin.address) throw 0xE004;

    val res = minter.sendDropAdmin(admin.address);
    res.waitForFirstTransaction();

    val after = minter.getJettonData();
    assert (after.totalSupply == 1000000000000000000) throw 0xE005;
    assert (!after.mintable) throw 0xE006;
    assert (after.adminAddress == null) throw 0xE007;

    printJettonMinterInfo(minter, "EMPC_FINAL");
}
