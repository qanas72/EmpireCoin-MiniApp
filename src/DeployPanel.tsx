import { useMemo, useState } from 'react'
import { Address, beginCell, Cell, Dictionary } from '@ton/core'
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'

const EXPECTED_TESTNET_WALLET = '0QBa9SNhRIiPFJZRt3FROllgc70DOBmdLTKV9dxsTl2H2B4D'
const TESTNET_NETWORK = '-3'
const DEPLOY_AMOUNT = '50000000' // 0.05 TON

type BuildArtifact = { code_boc64: string; hash: string }

async function metadataKey(key: string): Promise<bigint> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return BigInt('0x' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join(''))
}

async function makeMetadataCell(): Promise<Cell> {
  const fields: [string, string][] = [
    ['name', 'EmpireCoin'],
    ['symbol', 'EMPC'],
    ['description', 'EmpireCoin (EMPC), the fixed-supply community token on TON.'],
    ['image', 'https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-icon.png'],
    ['decimals', '9'],
  ]
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
  for (const [key, value] of fields) {
    const valueCell = beginCell().storeUint(0, 32).storeStringTail(value).endCell()
    dict.set(await metadataKey(key), valueCell)
  }
  return beginCell().storeUint(0, 32).storeDict(dict).endCell()
}

function makeStateInit(code: Cell, admin: Address, metadata: Cell): Cell {
  const data = beginCell()
    .storeCoins(0)
    .storeAddress(admin)
    .storeAddress(null)
    .storeRef(metadata)
    .endCell()

  return beginCell()
    .storeBit(0) // split_depth: none
    .storeBit(0) // special: none
    .storeMaybeRef(code)
    .storeMaybeRef(data)
    .storeBit(0) // empty library dictionary
    .endCell()
}

export default function DeployPanel() {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [artifactHash, setArtifactHash] = useState('')
  const [artifactError, setArtifactError] = useState('')

  const walletAddress = useMemo(() => {
    if (!wallet) return ''
    try { return Address.parse(wallet.account.address).toRawString() } catch { return '' }
  }, [wallet])
  const expectedAddress = useMemo(() => Address.parse(EXPECTED_TESTNET_WALLET).toRawString(), [])
  const correctWallet = !!wallet && wallet.account.chain === TESTNET_NETWORK && walletAddress === expectedAddress

  async function prepareAndSend() {
    if (!wallet || !correctWallet) {
      setMessage('کیف پول مورد تأیید نیست. کیف پول اختصاصی Testnet را وصل کن.')
      return
    }
    setBusy(true)
    setMessage('در حال آماده‌سازی قرارداد و بررسی شبکه…')
    setArtifactError('')
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}empirecoin-minter-code.json?build=1`, { cache: 'no-store' })
      if (!response.ok) throw new Error('فایل کامپایل‌شده قرارداد در دسترس نیست. کمی بعد دوباره تلاش کن.')
      const artifact = await response.json() as BuildArtifact
      if (!artifact.code_boc64 || !artifact.hash) throw new Error('فایل قرارداد معتبر نیست.')
      setArtifactHash(artifact.hash)

      const code = Cell.fromBase64(artifact.code_boc64)
      const admin = Address.parse(wallet.account.address)
      const metadata = await makeMetadataCell()
      const stateInit = makeStateInit(code, admin, metadata)
      const destination = Address.fromRawString(
        (await import('@ton/core')).contractAddress(0, { code, data: beginCell()
          .storeCoins(0).storeAddress(admin).storeAddress(null).storeRef(metadata).endCell() }).toRawString()
      )
      const derivedAddress = destination.toString({ bounceable: false, testOnly: true })
      setContractAddress(derivedAddress)

      // Refuse to send if the deterministic address already has an account on Testnet.
      const accountResponse = await fetch(`https://testnet.toncenter.com/api/v2/getAddressInformation?address=${encodeURIComponent(derivedAddress)}`)
      if (!accountResponse.ok) throw new Error('وضعیت آدرس قرارداد از شبکه قابل بررسی نیست؛ برای جلوگیری از ارسال تکراری، تراکنش متوقف شد.')
      const accountInfo = await accountResponse.json()
      if (accountInfo?.result?.state && accountInfo.result.state !== 'uninit') {
        throw new Error('این آدرس قرارداد قبلاً فعال شده است؛ تراکنش جدید ارسال نشد.')
      }

      setMessage('آدرس و اطلاعات قرارداد آماده است. درخواست تأیید به کیف پول فرستاده می‌شود.')
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        network: TESTNET_NETWORK,
        messages: [{
          address: derivedAddress,
          amount: DEPLOY_AMOUNT,
          stateInit: stateInit.toBoc().toString('base64'),
        }],
      })
      setMessage('درخواست تراکنش به کیف پول ارسال شد. پس از تأیید، وضعیت را در اکسپلورر Testnet بررسی کن؛ تا تأیید شبکه، قرارداد را مستقرشده حساب نکن.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'استقرار انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="feature-panel deploy-panel">
      <span className="feature-icon">♛</span>
      <span className="eyebrow">OWNER · TON TESTNET</span>
      <h2>استقرار آزمایشی EMPC</h2>
      <p>این مرحله فقط قرارداد را با عرضه اولیه صفر روی Testnet مستقر می‌کند. هیچ توکنی صادر نمی‌شود و هیچ دارایی Mainnet درگیر نیست.</p>
      <div className="notice">
        <b>کیف پول مورد انتظار</b><br />
        {EXPECTED_TESTNET_WALLET}<br />
        <b>شبکه:</b> TON Testnet · <b>مبلغ تراکنش:</b> 0.05 TON + کارمزد شبکه
      </div>
      <TonConnectButton />
      {!wallet && <div className="notice">کیف پول MyTonWallet را وصل کن و شبکه را روی Testnet قرار بده.</div>}
      {wallet && <div className={correctWallet ? 'deploy-status good' : 'deploy-status warn'}>
        {correctWallet ? '✓ کیف پول و شبکه درست است.' : wallet.account.chain !== TESTNET_NETWORK ? 'شبکه کیف پول Testnet نیست. فعلاً هیچ تراکنشی ارسال نمی‌شود.' : 'این آدرس با کیف پول Testnet ثبت‌شده مطابقت ندارد.'}
        <br />آدرس متصل: {wallet.account.address}
      </div>}
      {artifactHash && <div className="notice">شناسه کد قرارداد: <code>{artifactHash}</code></div>}
      {contractAddress && <div className="notice">آدرس محاسبه‌شده قرارداد: <code>{contractAddress}</code></div>}
      <button className="gold-button" disabled={!correctWallet || busy} onClick={prepareAndSend}>
        {busy ? 'در حال آماده‌سازی…' : 'بررسی و درخواست استقرار روی Testnet'}
      </button>
      {message && <div className="notice" role="status">{message}</div>}
      {contractAddress && <p><a href={`https://testnet.tonscan.org/address/${contractAddress}`} target="_blank" rel="noreferrer">مشاهده آدرس در TON Testnet Explorer</a></p>}
      <div className="mining-foot">تا زمانی که آدرس، شبکه و مبلغ را در MyTonWallet بررسی نکرده‌ای، تراکنش را تأیید نکن. عبارت بازیابی یا کلید خصوصی هرگز لازم نیست.</div>
    </div>
  )
}
