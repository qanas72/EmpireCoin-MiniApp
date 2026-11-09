const SUPABASE_URL = 'https://hxmkdnuqphvkxdxgwrrb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2OFnM9_zBht8PbOvv5anaQ_1yaJmv--';
const MAINNET_CHAIN = '-239';
const $ = (id) => document.getElementById(id);
let telegramInitData = '';
let telegramVerified = false;
let tonUI = null;
let proofBusy = false;

const showError = (message) => {
  const el = $('app-error');
  el.textContent = message;
  el.classList.remove('hidden');
};
const clearError = () => {
  $('app-error').textContent = '';
  $('app-error').classList.add('hidden');
};
const setStatus = (id, message) => { $(id).textContent = message; };

async function walletApi(action, extra = {}) {
  if (!telegramInitData) throw new Error('Open the Mini App from the official Telegram bot first.');
  const response = await fetch(SUPABASE_URL + '/functions/v1/ton-wallet-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify({ action, initData: telegramInitData, ...extra })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Wallet verification request failed.');
  return data;
}

async function startTelegram() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.initData) {
    setStatus('telegram-status', 'Open this page from the official @EmpireCoinOfficialBot menu to verify your Telegram account.');
    $('account-note').textContent = 'Telegram verification is required before linking a wallet.';
    return false;
  }
  webApp.ready?.();
  webApp.expand?.();
  telegramInitData = webApp.initData;
  setStatus('telegram-status', 'Securely verifying your Telegram account…');
  try {
    const response = await fetch(SUPABASE_URL + '/functions/v1/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ initData: telegramInitData })
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.telegramUser) throw new Error(data.error || 'Telegram verification failed');
    telegramVerified = true;
    const user = data.telegramUser;
    $('telegram-title').textContent = 'Telegram connected';
    setStatus('telegram-status', 'Your Telegram identity has been verified by the server.');
    $('user-card').textContent = [user.firstName, user.username ? '@' + user.username : null, 'ID: ' + user.id].filter(Boolean).join(' · ');
    $('user-card').classList.remove('hidden');
    $('account-note').textContent = 'Telegram account verified. Your wallet can now be securely linked.';
    return true;
  } catch (error) {
    setStatus('telegram-status', 'Telegram verification could not be completed.');
    showError('Telegram: ' + (error?.message || String(error)));
    return false;
  }
}

async function prepareWalletProof() {
  if (!telegramVerified || !tonUI) return;
  tonUI.setConnectRequestParameters({ state: 'loading' });
  try {
    const result = await walletApi('payload');
    tonUI.setConnectRequestParameters({ state: 'ready', value: { tonProof: result.payload } });
    setStatus('wallet-status', 'Secure ownership challenge ready. Connect or verify your TON Mainnet wallet.');
  } catch (error) {
    tonUI.setConnectRequestParameters(null);
    setStatus('wallet-status', 'Wallet verification challenge could not be prepared.');
    showError('Wallet challenge: ' + (error?.message || String(error)));
  }
}

async function loadVerifiedWallet() {
  if (!telegramVerified) return null;
  try {
    const result = await walletApi('status');
    const saved = result.wallet;
    if (saved?.verified) {
      $('wallet-status').textContent = 'Previously verified wallet: ' + saved.wallet_address + ' · TON Mainnet.';
      $('wallet-verification').textContent = 'Wallet ownership verified';
      $('wallet-verification').classList.remove('hidden');
      return saved;
    }
    $('wallet-verification').classList.add('hidden');
    return null;
  } catch (error) {
    showError('Wallet status: ' + (error?.message || String(error)));
    return null;
  }
}

async function verifyConnectedWallet(wallet) {
  const item = wallet?.connectItems?.tonProof;
  if (!item || !('proof' in item)) {
    const saved = await loadVerifiedWallet();
    const connectedAddress = wallet?.account?.address;
    if (saved && connectedAddress === saved.wallet_address && wallet?.account?.chain === MAINNET_CHAIN) {
      $('wallet-verification').textContent = 'Wallet ownership verified';
      $('wallet-verification').classList.remove('hidden');
      setStatus('wallet-status', 'Verified TON Mainnet wallet: ' + saved.wallet_address);
    } else {
      $('wallet-verification').classList.add('hidden');
      setStatus('wallet-status', 'Wallet is connected, but ownership is not verified yet. Tap “Verify wallet ownership” below and reconnect.');
    }
    return;
  }

  try {
    if (wallet.account.chain !== MAINNET_CHAIN) throw new Error('Please connect your TON Mainnet wallet, not Testnet.');
    setStatus('wallet-status', 'Checking your wallet ownership proof securely…');
    const result = await walletApi('verify', {
      address: wallet.account.address,
      network: wallet.account.chain,
      public_key: wallet.account.publicKey,
      proof: { ...item.proof, state_init: wallet.account.walletStateInit }
    });
    $('wallet-verification').textContent = 'Wallet ownership verified';
    $('wallet-verification').classList.remove('hidden');
    setStatus('wallet-status', 'Verified TON Mainnet wallet: ' + result.wallet.wallet_address);
    $('account-note').textContent = 'Telegram identity and TON Mainnet wallet are securely linked.';
    clearError();
  } catch (error) {
    $('wallet-verification').classList.add('hidden');
    setStatus('wallet-status', 'Wallet ownership verification failed.');
    showError('Wallet proof: ' + (error?.message || String(error)));
  }
}

async function reconnectForProof() {
  if (!telegramVerified || !tonUI || proofBusy) return;
  proofBusy = true;
  $('verify-wallet-button').disabled = true;
  clearError();
  try {
    await prepareWalletProof();
    if (tonUI.connected) await tonUI.disconnect();
    await tonUI.openModal();
  } catch (error) {
    showError('Reconnect: ' + (error?.message || String(error)));
  } finally {
    proofBusy = false;
    $('verify-wallet-button').disabled = false;
  }
}

async function startWallet() {
  try {
    const { TonConnectUI } = await import('https://esm.sh/@tonconnect/ui@2.3.0');
    tonUI = new TonConnectUI({
      manifestUrl: new URL('./tonconnect-manifest.json', window.location.href).href,
      buttonRootId: 'ton-connect'
    });
    // Network is enforced by the wallet-proof verifier below; this UI build does not expose setConnectionNetwork().
    tonUI.onStatusChange(async (wallet) => {
      if (!wallet) {
        setStatus('wallet-status', telegramVerified ? 'No TON Mainnet wallet connected.' : 'Verify Telegram first to link a wallet.');
        $('wallet-verification').classList.add('hidden');
        return;
      }
      const address = wallet.account?.address || 'Address unavailable';
      setStatus('wallet-status', 'Connected · TON Mainnet · ' + address.slice(0, 8) + '…' + address.slice(-6) + '. Checking ownership…');
      if (telegramVerified) await verifyConnectedWallet(wallet);
    });
    if (telegramVerified) {
      await loadVerifiedWallet();
      await prepareWalletProof();
      $('verify-wallet-button').classList.remove('hidden');
      $('verify-wallet-button').disabled = false;
    } else {
      setStatus('wallet-status', 'Wallet connection is available after Telegram verification.');
      $('verify-wallet-button').classList.add('hidden');
    }
  } catch (error) {
    setStatus('wallet-status', 'Wallet connector could not load. The rest of the Mini App remains available.');
    showError('TON Connect: ' + (error?.message || String(error)));
  }
}

$('verify-wallet-button').addEventListener('click', reconnectForProof);

window.addEventListener('error', event => {
  if (event.message) showError('App error: ' + event.message);
});
window.addEventListener('unhandledrejection', event => {
  showError('App startup error: ' + (event.reason?.message || String(event.reason)));
});

async function initialize() {
  await startTelegram();
  await startWallet();
}
initialize();