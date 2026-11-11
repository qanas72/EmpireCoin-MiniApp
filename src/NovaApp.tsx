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

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready?.()
    tg?.expand?.()
  }, [])

  useEffect(() => {
    if (restored && !wallet) tonConnectUI.setConnectionNetwork(network)
  }, [restored, wallet, network, tonConnectUI])

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
          <div className="muted">Reward ledger will be connected after secure backend setup.</div>
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
            <div><span>Connection status</span><b>{!restored ? 'Restoring saved connection…' : wallet ? 'Connected' : 'Not connected'}</b></div>
            <div><span>Wallet address</span><b>{wallet ? short(wallet.account.address) : 'Not connected'}</b></div>
            <div><span>Wallet network</span><b>{wallet ? walletNetwork : '—'}</b></div>
            <div><span>Network check</span><b className={wallet && networkMatches ? 'good' : wallet ? 'warn' : ''}>{wallet ? (networkMatches ? 'Matches selection' : 'Different from selection') : 'Waiting for connection'}</b></div>
          </div>
          {wallet && <button className="disconnect" onClick={() => tonConnectUI.disconnect()}>Disconnect wallet</button>}
          <div className="notice"><b>Ownership verification is not active</b><p>No verification fee or transaction will be requested during this connection test.</p></div>
        </section>

        <section className="feature-grid">
          <button onClick={() => setPage('mining')}><b>✧ Free Mining</b><small>Daily reward cycle</small></button>
          <button onClick={() => setPage('invite')}><b>♧ Referral Hub</b><small>Invite friends</small></button>
          <button onClick={() => setPage('tasks')}><b>▤ Mission Board</b><small>Tasks & campaigns</small></button>
          <button onClick={() => setPage('profile')}><b>◉ Profile</b><small>Account overview</small></button>
        </section>
        <section className="panel preview-panel"><p className="eyebrow">{page.toUpperCase()}</p><h2>{page === 'wallet' ? 'Wallet connection test' : page === 'home' ? 'Welcome to Nova' : page === 'mining' ? 'Free Mining' : page === 'invite' ? 'Referral Hub' : page === 'tasks' ? 'Mission Board' : 'Member Profile'}</h2><p className="muted">This section is in preview. Rewards, referrals, missions and withdrawals remain disabled until secure server-side verification is deployed.</p></section>
      </main>

      <nav className="nova-nav">
        {(['home', 'mining', 'invite', 'tasks', 'wallet', 'profile'] as Page[]).map((item) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}><span>{({home:'⌂',mining:'✧',invite:'♧',tasks:'▤',wallet:'◇',profile:'◉'} as Record<Page,string>)[item]}</span><small>{item === 'invite' ? 'Invite' : item[0].toUpperCase()+item.slice(1)}</small></button>)}
      </nav>
    </div>
  )
}
