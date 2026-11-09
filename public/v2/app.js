const SUPABASE_URL = 'https://hxmkdnuqphvkxdxgwrrb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2OFnM9_zBht8PbOvv5anaQ_1yaJmv--';
const $ = (id) => document.getElementById(id);
const showError = (message) => { const el=$('app-error'); el.textContent=message; el.classList.remove('hidden'); };
const setStatus = (id,message) => { $(id).textContent=message; };

async function startTelegram() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.initData) {
    setStatus('telegram-status','Open this page from the official @EmpireCoinOfficialBot menu to verify your Telegram account.');
    return;
  }
  webApp.ready?.();
  webApp.expand?.();
  setStatus('telegram-status','Securely verifying your Telegram account…');
  try {
    const response = await fetch(SUPABASE_URL + '/functions/v1/telegram-auth', {
      method:'POST',
      headers:{'Content-Type':'application/json', apikey:SUPABASE_KEY},
      body:JSON.stringify({initData:webApp.initData})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Telegram verification failed');
    const user=data.telegramUser || {};
    $('telegram-title').textContent='Telegram connected';
    setStatus('telegram-status','Your Telegram identity has been verified.');
    $('user-card').textContent=[user.firstName,user.username ? '@'+user.username : null,'ID: '+user.id].filter(Boolean).join(' · ');
    $('user-card').classList.remove('hidden');
    $('account-note').textContent='Telegram account verified. Wallet and account data can now be connected safely.';
  } catch (error) {
    setStatus('telegram-status','Telegram verification could not be completed.');
    showError('Telegram: '+(error?.message || String(error)));
  }
}

async function startWallet() {
  try {
    const { TonConnectUI } = await import('https://esm.sh/@tonconnect/ui@2.3.0');
    const ui = new TonConnectUI({
      manifestUrl: new URL('./tonconnect-manifest.json', window.location.href).href,
      buttonRootId: 'ton-connect'
    });
    ui.onStatusChange(wallet => {
      if (!wallet) { setStatus('wallet-status','No TON wallet connected.'); return; }
      const address=wallet.account?.address || 'Address unavailable';
      const network=wallet.account?.chain === '-239' ? 'TON Mainnet' : wallet.account?.chain === '-3' ? 'TON Testnet' : 'TON network';
      setStatus('wallet-status','Connected · '+network+' · '+address.slice(0,8)+'…'+address.slice(-6)+'. Ownership verification is a separate security step.');
    });
    setStatus('wallet-status','TON Connect is ready. Choose your wallet to connect.');
  } catch (error) {
    setStatus('wallet-status','Wallet connector could not load. The rest of the Mini App remains available.');
    showError('TON Connect: '+(error?.message || String(error)));
  }
}

window.addEventListener('error', event => {
  if (event.message) showError('App error: '+event.message);
});
window.addEventListener('unhandledrejection', event => {
  showError('App startup error: '+(event.reason?.message || String(event.reason)));
});
startTelegram();
startWallet();