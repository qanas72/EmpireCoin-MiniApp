import { useEffect, useState } from 'react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'

type Section = 'home' | 'tasks' | 'referrals' | 'wallet' | 'profile'

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } }
  }
}

const SUPABASE_URL = 'https://hxmkdnuqphvkxdxgwrrb.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2OFnM9_zBht8PbOvv5anaQ_1yaJmv--'

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'tasks', label: 'Tasks', icon: '▤' },
  { id: 'referrals', label: 'Invite', icon: '♧' },
  { id: 'wallet', label: 'Wallet', icon: '◇' },
  { id: 'profile', label: 'Profile', icon: '◉' },
]

function App() {
  const [section, setSection] = useState<Section>('home')
  const wallet = useTonWallet()
  const [telegramStatus, setTelegramStatus] = useState<'checking' | 'verified' | 'unavailable' | 'error'>('checking')
  const [telegramUser, setTelegramUser] = useState<{ id: number; username: string | null; firstName: string | null } | null>(null)

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp?.initData) {
      setTelegramStatus('unavailable')
      return
    }
    webApp.ready?.()
    webApp.expand?.()
    let cancelled = false
    fetch(`${SUPABASE_URL}/functions/v1/telegram-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ initData: webApp.initData }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Telegram verification failed')
        if (!cancelled) {
          setTelegramUser(data.telegramUser)
          setTelegramStatus('verified')
        }
      })
      .catch(() => { if (!cancelled) setTelegramStatus('error') })
    return () => { cancelled = true }
  }, [])
  const walletAddress = wallet?.account.address
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-6)}` : ''

  const title = {
    home: 'Your empire starts here',
    tasks: 'Earn through tasks',
    referrals: 'Build your network',
    wallet: 'Your TON wallet',
    profile: 'Your profile',
  }[section]

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setSection('home')} aria-label="EmpireCoin home">
          <span className="brand-mark">♛</span>
          <span className="brand-name">EMPIRE<span>COIN</span></span>
        </a>
        <span className="network-pill"><i /> TON ECOSYSTEM</span>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="eyebrow"><span /> THE NEXT DIGITAL ECONOMY</div>
        <h1>{title}</h1>
        <p className="hero-copy">Earn. Build. Rise.</p>

        <div className="balance-card">
          <div className="balance-top">
            <span className="muted-label">EMPC AVAILABLE BALANCE</span>
            <span className="demo-tag">PREVIEW</span>
          </div>
          <div className="balance-value">0 <small>EMPC</small></div>
          <div className="balance-bottom">
            <span>On-chain balance will appear after wallet connection.</span>
            <span className="coin-symbol">♛</span>
          </div>
        </div>
      </section>

      <section className="content">
        {section === 'home' && (
          <>
            <div className="section-heading"><div><span className="eyebrow">YOUR CONTROL CENTER</span><h2>Empire overview</h2></div><span className="live-label">● PREVIEW</span></div>
            <div className="stats-grid">
              <article className="stat-card"><span className="stat-icon">◈</span><span className="muted-label">Wallet status</span><strong>{wallet ? 'Connected' : 'Not connected'}</strong><small>{wallet ? shortAddress : 'Connect your TON wallet'}</small></article>
              <article className="stat-card"><span className="stat-icon">✦</span><span className="muted-label">Daily earning</span><strong>Coming soon</strong><small>Reward rules not activated</small></article>
            </div>
            <div className="section-heading compact"><div><span className="eyebrow">EXPLORE</span><h2>Empire services</h2></div></div>
            <div className="service-list">
              <button className="service-row" onClick={() => setSection('tasks')}><span className="service-icon">▤</span><span><b>Tasks & campaigns</b><small>Complete tasks and create promotions</small></span><em>›</em></button>
              <button className="service-row" onClick={() => setSection('referrals')}><span className="service-icon">♧</span><span><b>Referral program</b><small>Invite friends and track rewards</small></span><em>›</em></button>
              <button className="service-row" onClick={() => setSection('wallet')}><span className="service-icon">◇</span><span><b>TON wallet</b><small>Connect your personal wallet</small></span><em>›</em></button>
            </div>
          </>
        )}

        {section === 'tasks' && <div className="feature-panel"><span className="feature-icon">▤</span><span className="eyebrow">EMPIRE MARKETPLACE</span><h2>Tasks & campaigns</h2><p>Discover community campaigns, complete verified tasks, or create your own promotion.</p><div className="notice">Task rewards and campaign payments are not active yet. They will be enabled after backend and anti-fraud checks are ready.</div><button className="gold-button" disabled>Coming soon</button></div>}
        {section === 'referrals' && <div className="feature-panel"><span className="feature-icon">♧</span><span className="eyebrow">GROW THE EMPIRE</span><h2>Invite & earn</h2><p>Your personal invitation link and referral history will appear here.</p><div className="notice">Referral rewards will only be credited after membership and wallet verification are confirmed by the server.</div><button className="gold-button" disabled>Referral link coming soon</button></div>}
        {section === 'wallet' && <div className="feature-panel"><span className="feature-icon">◇</span><span className="eyebrow">TON CONNECT</span><h2>Connect your wallet</h2><p>Use your own TON-compatible wallet. EmpireCoin will never ask for your seed phrase or private key.</p><div className="notice">Connect your own TON wallet securely. The app never receives your seed phrase or private key. Connecting a wallet does not deposit funds or activate paid features.</div><TonConnectButton />{wallet && <p className="wallet-address">Connected: {shortAddress}</p>}</div>}
        {section === 'profile' && <div className="feature-panel"><span className="feature-icon">◉</span><span className="eyebrow">MEMBER AREA</span><h2>Your Empire ID</h2><p>Your verified Telegram profile, membership status, and account activity will appear here.</p><div className="notice">{telegramStatus === 'verified' && telegramUser ? `Telegram verified: ${telegramUser.firstName || 'Member'} · ID ${telegramUser.id}` : telegramStatus === 'checking' ? 'Verifying your Telegram account securely…' : telegramStatus === 'unavailable' ? 'Open EmpireCoin from the official Telegram bot to verify your account.' : 'Telegram verification is not configured yet. Please try again later.'}</div></div>}
      </section>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(item => <button key={item.id} className={section === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
      <footer className="footer"><span>♛ EMPIRECOIN</span><span>BUILT ON TON · {new Date().getFullYear()}</span></footer>
    </main>
  )
}

export default App