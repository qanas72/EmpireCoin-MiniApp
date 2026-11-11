import { useEffect, useState } from 'react'
import { TonConnectButton, useIsConnectionRestored, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'

type Network = '-3' | '-239'
type Page = 'home' | 'wallet' | 'mining' | 'invite' | 'tasks' | 'profile'

const short = (value: string) => value.length > 15 ? value.slice(0, 7) + '…' + value.slice(-6) : value

export default function NovaApp() {
  const [network, setNetwork] = useState<Network>('-3')
  const [page, setPage] = useState<Page>('wallet')
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const restored = useIsConnectionRestored()
  const [telegramState, setTelegramState] = useState<'checking' | 'verified' | 'unavailable' | 'error'>('checking')
  const [telegramUser, setTelegramUser] = useState<{ id: number; username: string | null; firstName: string | null } | null>(null)
  const [authMessage, setAuthMessage] = useState('Checking your Telegram session…')
  const [proofState, setProofState] = useState<'idle' | 'preparing' | 'ready' | 'verifying' | 'verified' | 'error'>('idle')
  const [proofMessage, setProofMessage] = useState('Wallet ownership has not been verified.')
  const [verifiedWallet, setVerifiedWallet] = useState<{ wallet_address: string; network: string; verified_at: string } | null>(null)

  const SUPABASE_URL = 'https://hxmkdnuqphvkxdxgwrrb.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_2OFnM9_zBht8PbOvv5anaQ_1yaJmv--'

  async function backendRequest(functionName: string, body: Record<string, unknown>) {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) throw new Error('Open EmpireCoin from the official Telegram bot.')
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ initData, ...body }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Secure verification request failed.')
    return result
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready?.()
    tg?.expand?.()
    if (!tg?.initData) {
      setTelegramState('unavailable')
      setAuthMessage('Telegram verification is available only inside the official Mini App.')
      return
    }
    let cancelled = false
    backendRequest('telegram-auth', {}).then((result) => {
      if (cancelled) return
      setTelegramUser(result.telegramUser)
      setTelegramState('verified')
      setAuthMessage('Telegram account verified.')
    }).catch((error) => {
      if (cancelled) return
      setTelegramState('error')
      setAuthMessage(error instanceof Error ? error.message : 'Telegram verification failed.')
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (restored && !wallet) tonConnectUI.setConnectionNetwork(network)
  }, [restored, wallet, network, tonConnectUI])

  useEffect(() => {
    if (telegramState !== 'verified') return
    let cancelled = false
    const prepare = async () => {
      if (wallet) return
      setProofState('preparing')
      setProofMessage('Preparing a one-time wallet ownership challenge…')
      tonConnectUI.setConnectRequestParameters({ state: 'loading' })
      try {
        const challenge = await backendRequest('ton-wallet-auth', { action: 'payload', network })
        if (cancelled) return
        tonConnectUI.setConnectRequestParameters({ state: 'ready', value: { tonProof: challenge.payload } })
        setProofState('ready')
        setProofMessage('Connect your TON wallet and approve the ownership signature. No payment is requested.')
      } catch (error) {
        if (cancelled) return
        tonConnectUI.setConnectRequestParameters(null)
        setProofState('error')
        setProofMessage(error instanceof Error ? error.message : 'Could not prepare wallet verification.')
      }
    }
    const verify = async () => {
      if (!wallet) return
      const proofItem = wallet.connectItems?.tonProof
      if (!proofItem || !('proof' in proofItem)) {
        try {
          const status = await backendRequest('ton-wallet-auth', { action: 'status', network: wallet.account.chain })
          if (cancelled) return
          if (status.wallet?.verified && status.wallet.wallet_address === wallet.account.address) {
            setVerifiedWallet(status.wallet)
            setProofState('verified')
            setProofMessage('This wallet is already verified for your Telegram account.')
          } else {
            setProofState('error')
            setProofMessage('No ownership signature was returned. Disconnect and reconnect the wallet to sign a fresh challenge.')
          }
        } catch (error) {
          if (!cancelled) {
            setProofState('error')
            setProofMessage(error instanceof Error ? error.message : 'Wallet verification status unavailable.')
          }
        }
        return
      }
      setProofState('verifying')
      setProofMessage('Verifying the TON ownership signature…')
      try {
        const result = await backendRequest('ton-wallet-auth', {
          action: 'verify',
          address: wallet.account.address,
          network: wallet.account.chain,
          public_key: wallet.account.publicKey,
          proof: { ...proofItem.proof, state_init: wallet.account.walletStateInit },
        })
        if (cancelled) return
        setVerifiedWallet(result.wallet)
        setProofState('verified')
        setProofMessage('TON wallet ownership verified successfully.')
      } catch (error) {
        if (!cancelled) {
          setProofState('error')
          setProofMessage(error instanceof Error ? error.message : 'Wallet ownership verification failed.')
        }
      }
    }
    if (wallet) void verify()
    else void prepare()
    return () => { cancelled = true }
  }, [telegramState, wallet, network, tonConnectUI])

  const chooseNetwork = (next: Network) => {
    if (wallet) {
      setPage('wallet')
      return
    }
    tonConnectUI.setConnectionNetwork(next)
    setNetwork(next)
  }

  const walletNetwork = wallet?.account.chain === '-3' ? 'TON Testnet' : wallet?.account.chain === '-239' ? 'TON Mainnet' : 'Unknown network'
  const networkMatches = wallet ? wallet.account.chain === network : false
  const walletVerified = !!wallet && proofState === 'verified' && verifiedWallet?.wallet_address === wallet.account.address

  return (
    <div className="nova-shell">
      <header className="nova-header">
        <div className="brand-mark"><img src="../v3/crown.svg" alt="EmpireCoin crown" /><div><strong>EMPIRE<span>COIN</span></strong><small>NOVA · DIGITAL ECONOMY</small></div></div>
        <span className="network-tag">{network === '-3' ? 'TESTNET' : 'MAINNET'}</span>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">THE NEXT ERA STARTS HERE</p>
          <h1>Own your <em>future.</em></h1>
          <p>A new universe of rewards, missions and digital ownership.</p>
        </section>

        <section className="portfolio panel">
          <div className="panel-kicker">YOUR EMPC PORTFOLIO <span>PREVIEW</span></div>
          <div className="balance">— <small>EMPC</small></div>
          <div className="muted">Telegram identity: {telegramState === 'verified' ? 'Verified' : telegramState === 'checking' ? 'Checking…' : 'Not verified'} · Wallet ownership: {walletVerified ? 'Verified' : 'Not verified'}</div>
        </section>

        <section className="panel wallet-panel">
          <div className="section-heading"><div><p className="eyebrow">TON CONNECT</p><h2>Your <em>Wallet</em></h2></div><span className="status-dot">{restored ? 'READY' : 'RESTORING'}</span></div>
          <p className="muted">Connect a wallet on the selected network. Never share your recovery phrase.</p>
          <div className="network-select" aria-label="Select TON network">
            <button className={network === '-3' ? 'selected' : ''} onClick={() => chooseNetwork('-3')} disabled={!!wallet}>TON Testnet</button>
            <button className={network === '-239' ? 'selected' : ''} onClick={() => chooseNetwork('-239')} disabled={!!wallet}>TON Mainnet</button>
          </div>
          <div className="connect-row"><TonConnectButton /></div>
          <div className="wallet-details">
            <div><span>Telegram account</span><b>{telegramUser ? (telegramUser.username ? '@' + telegramUser.username : telegramUser.firstName || 'Verified') : telegramState}</b></div>
            <div><span>Telegram security</span><b className={telegramState === 'verified' ? 'good' : 'warn'}>{telegramState === 'verified' ? 'Verified' : authMessage}</b></div>
            <div><span>Wallet ownership</span><b className={walletVerified ? 'good' : 'warn'}>{walletVerified ? 'Verified' : proofState === 'verifying' ? 'Verifying…' : 'Not verified'}</b></div>
            <div><span>Connection status</span><b>{!restored ? 'Restoring saved connection…' : wallet ? 'Connected' : 'Not connected'}</b></div>
            <div><span>Wallet address</span><b>{wallet ? short(wallet.account.address) : 'Not connected'}</b></div>
            <div><span>Wallet network</span><b>{wallet ? walletNetwork : '—'}</b></div>
            <div><span>Network check</span><b className={wallet && networkMatches ? 'good' : wallet ? 'warn' : ''}>{wallet ? (networkMatches ? 'Matches selection' : 'Different from selection') : 'Waiting for connection'}</b></div>
          </div>
          {wallet && <button className="disconnect" onClick={() => tonConnectUI.disconnect()}>Disconnect wallet</button>}
          <div className="notice"><b>Secure verification</b><p>{proofMessage}</p><p>No verification fee, transfer, or blockchain transaction is requested. Testnet and Mainnet wallet ownership are verified separately.</p></div>
        </section>

        <section className="feature-grid">
          <button onClick={() => setPage('mining')}><b>✧ Free Mining</b><small>Daily reward cycle</small></button>
          <button onClick={() => setPage('invite')}><b>♧ Referral Hub</b><small>Invite friends</small></button>
          <button onClick={() => setPage('tasks')}><b>▤ Mission Board</b><small>Tasks & campaigns</small></button>
          <button onClick={() => setPage('profile')}><b>◉ Profile</b><small>Account overview</small></button>
        </section>
        <section className="panel preview-panel"><p className="eyebrow">{page.toUpperCase()}</p><h2>{page === 'wallet' ? 'Wallet connection test' : page === 'home' ? 'Welcome to Nova' : page === 'mining' ? 'Free Mining' : page === 'invite' ? 'Referral Hub' : page === 'tasks' ? 'Mission Board' : 'Member Profile'}</h2><p className="muted">This section is in preview. Rewards, referrals, missions and withdrawals remain disabled until activity verification, anti-fraud controls, and audited reward release are complete.</p></section>
      </main>

      <nav className="nova-nav">
        {(['home', 'mining', 'invite', 'tasks', 'wallet', 'profile'] as Page[]).map((item) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}><span>{({home:'⌂',mining:'✧',invite:'♧',tasks:'▤',wallet:'◇',profile:'◉'} as Record<Page,string>)[item]}</span><small>{item === 'invite' ? 'Invite' : item[0].toUpperCase()+item.slice(1)}</small></button>)}
      </nav>
    </div>
  )
}
