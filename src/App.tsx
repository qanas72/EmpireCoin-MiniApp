import { useEffect, useState } from 'react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'

type Section = 'home' | 'tasks' | 'referrals' | 'wallet' | 'profile' | 'admin'

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
  { id: 'admin', label: 'Admin', icon: '♛' },
]

function App() {
  const [section, setSection] = useState<Section>('home')
  const wallet = useTonWallet()
  const [telegramStatus, setTelegramStatus] = useState<'checking' | 'verified' | 'unavailable' | 'error'>('checking')
  const [telegramUser, setTelegramUser] = useState<{ id: number; username: string | null; firstName: string | null } | null>(null)
  const [telegramError, setTelegramError] = useState('')
  const [adminData, setAdminData] = useState<any>(null)
  const [adminStatus, setAdminStatus] = useState<'checking' | 'ready' | 'denied' | 'error'>('checking')
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [newAdminId, setNewAdminId] = useState('')

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
          try {
            const adminResponse = await fetch(SUPABASE_URL + '/functions/v1/admin-api', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY }, body: JSON.stringify({ initData: webApp.initData, action: 'dashboard' }) })
            const adminResult = await adminResponse.json()
            if (adminResponse.ok) { setAdminData(adminResult); setAdminStatus('ready') }
            else if (adminResponse.status === 403) setAdminStatus('denied')
            else setAdminStatus('error')
          } catch { setAdminStatus('error') }
        }
      })
      .catch((err) => { if (!cancelled) { setTelegramError(err instanceof Error ? err.message : 'Telegram verification failed'); setTelegramStatus('error') } })
    return () => { cancelled = true }
  }, [])
  const walletAddress = wallet?.account.address
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-6)}` : ''

  async function adminRequest(action: string, payload: Record<string, unknown> = {}) {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) throw new Error('Open the official Telegram Mini App first.')
    const response = await fetch(SUPABASE_URL + '/functions/v1/admin-api', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY }, body: JSON.stringify({ initData, action, payload }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Admin request failed')
    return result
  }

  const title = {
    home: 'Your empire starts here',
    tasks: 'Earn through tasks',
    referrals: 'Build your network',
    wallet: 'Your TON wallet',
    profile: 'Your profile',
    admin: 'Empire administration',
  }[section]

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setSection('home')} aria-label="EmpireCoin home">
          <span className="brand-mark"><img src={`${import.meta.env.BASE_URL}crown.svg`} alt="EmpireCoin crown" /></span>
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
            <img className="coin-crown" src={`${import.meta.env.BASE_URL}crown.svg`} alt="" />
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
            <div className="mining-panel"><div className="mining-head"><span className="mining-icon">ϟ</span><div><span className="eyebrow">EMPC REWARDS</span><h2>Free Mining</h2></div><span className="mining-lock">LOCKED</span></div><p>Start earning EMPC through scheduled activity. Invite eligible friends to increase your mining speed.</p><div className="mining-stats"><div><small>Mining speed</small><strong>1.0×</strong></div><div><small>Referral boost</small><strong>0%</strong></div><div><small>Session status</small><strong>Not started</strong></div></div><button className="gold-button mining-start" disabled>{wallet ? "Verify wallet ownership first" : "Connect TON wallet first"}</button><div className="mining-foot">Wallet connection alone is not proof of ownership. Mining stays locked until Telegram and TON wallet verification, anti-fraud checks, and reward limits are active.</div><button className="referral-boost" onClick={() => setSection("referrals")}><span>♧</span><span><b>Invite friends · Boost mining speed</b><small>Referral multipliers will apply after verified invitations.</small></span><em>›</em></button></div><div className="section-heading compact"><div><span className="eyebrow">EXPLORE</span><h2>Empire services</h2></div></div>
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
        {section === 'profile' && <div className="feature-panel"><span className="feature-icon">◉</span><span className="eyebrow">MEMBER AREA</span><h2>Your Empire ID</h2><p>Your verified Telegram profile, membership status, and account activity will appear here.</p><div className="notice">{telegramStatus === 'verified' && telegramUser ? `Telegram verified: ${telegramUser.firstName || 'Member'} · ID ${telegramUser.id}` : telegramStatus === 'checking' ? 'Verifying your Telegram account securely…' : telegramStatus === 'unavailable' ? 'Open EmpireCoin from the official Telegram bot to verify your account.' : `Telegram verification failed: ${telegramError || 'Please try again later.'}`}</div></div>}
        {section === 'admin' && <div className="feature-panel admin-panel">
          <span className="feature-icon">♛</span><span className="eyebrow">SECURE CONTROL ROOM</span><h2>Admin dashboard</h2>
          {adminStatus === 'checking' && <div className="notice">Checking administrator permissions…</div>}
          {adminStatus === 'denied' && <div className="notice">This Telegram account is not an active administrator.</div>}
          {adminStatus === 'error' && <div className="notice">Could not load admin dashboard. Reopen the Mini App and try again.</div>}
          {adminStatus === 'ready' && adminData && <>
            <div className="notice">Signed in as {adminData.admin.role.toUpperCase()} · ID {adminData.admin.telegram_user_id}</div>
            <h3>Mining settings</h3>
            <label className="admin-toggle"><span>Mining enabled</span><input type="checkbox" checked={!!adminData.mining.mining_enabled} onChange={e=>setAdminData({...adminData,mining:{...adminData.mining,mining_enabled:e.target.checked}})} /></label>
            <label className="admin-toggle"><span>Referrals enabled</span><input type="checkbox" checked={!!adminData.mining.referrals_enabled} onChange={e=>setAdminData({...adminData,mining:{...adminData.mining,referrals_enabled:e.target.checked}})} /></label>
            <div className="admin-fields">
              {([['daily_base_reward','Daily base reward (EMPC)'],['referral_daily_bonus','Referral bonus per day'],['max_rewarded_referrals','Maximum rewarded referrals'],['max_speed_multiplier','Maximum speed multiplier'],['per_user_daily_cap','Per-user daily cap'],['global_daily_budget','Global daily budget']] as [string,string][]).map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="0.000001" value={adminData.mining[key]} onChange={e=>setAdminData({...adminData,mining:{...adminData.mining,[key]:e.target.value}})} /></label>)}
            </div>
            <button className="gold-button" disabled={adminSaving} onClick={async()=>{setAdminSaving(true);setAdminMessage('');try{const saved=await adminRequest('update_mining',adminData.mining);setAdminData({...adminData,mining:saved.mining});setAdminMessage('Settings saved.')}catch(err){setAdminMessage(err instanceof Error?err.message:'Save failed.')}finally{setAdminSaving(false)}}}>{adminSaving?'Saving…':'Save settings'}</button>
            {adminMessage && <div className="notice">{adminMessage}</div>}
            {adminData.admin.can_manage_admins && <><h3>Administrator accounts</h3><div className="admin-add"><input inputMode="numeric" placeholder="Telegram numeric ID" value={newAdminId} onChange={e=>setNewAdminId(e.target.value)} /><button onClick={async()=>{try{await adminRequest('add_admin',{telegram_user_id:newAdminId});setNewAdminId('');const refreshed=await adminRequest('dashboard');setAdminData(refreshed);setAdminMessage('Administrator added.')}catch(err){setAdminMessage(err instanceof Error?err.message:'Could not add admin.')}}}>Add administrator</button></div>{(adminData.admins||[]).map((a:any)=><div className="admin-user" key={a.telegram_user_id}><span>{a.role.toUpperCase()} · {a.telegram_user_id} · {a.is_active?'Active':'Inactive'}</span>{a.role==='admin' && a.is_active && <button onClick={async()=>{try{await adminRequest('deactivate_admin',{telegram_user_id:String(a.telegram_user_id)});setAdminData({...adminData,admins:adminData.admins.map((x:any)=>x.telegram_user_id===a.telegram_user_id?{...x,is_active:false}:x)})}catch(err){setAdminMessage(err instanceof Error?err.message:'Action failed.')}}}>Deactivate</button>}</div>)}</>}
          </>}
        </div>}
      </section>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.filter(item => item.id !== 'admin' || adminStatus === 'ready').map(item => <button key={item.id} className={section === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
      <footer className="footer"><span><img className="footer-crown" src={`${import.meta.env.BASE_URL}crown.svg`} alt="" /> EMPIRECOIN</span><span>BUILT ON TON · {new Date().getFullYear()}</span></footer>
    </main>
  )
}

export default App