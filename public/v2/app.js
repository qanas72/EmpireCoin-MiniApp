const SUPABASE_URL='https://hxmkdnuqphvkxdxgwrrb.supabase.co';
const SUPABASE_KEY='sb_publishable_2OFnM9_zBht8PbOvv5anaQ_1yaJmv--';
const MAINNET_CHAIN='-239';
const TESTNET_CHAIN='-3';
let selectedNetwork=MAINNET_CHAIN;
const $=id=>document.getElementById(id);
let initData='',telegramUser=null,telegramVerified=false,tonUI=null,verifiedWallet=null,adminData=null,proofBusy=false,toastTimer=null;

function showError(message){const el=$('app-error');el.textContent=message;el.classList.remove('hidden')}
function clearError(){$('app-error').textContent='';$('app-error').classList.add('hidden')}
function toast(message){const el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),3200)}
function shortAddress(value){return value?value.slice(0,7)+'…'+value.slice(-6):'Not connected'}
function setVerifyButton(visible){const b=$('verify-wallet-button');b.classList.toggle('hidden',!visible);b.disabled=!visible||proofBusy}
function go(view){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
$('menu-profile').addEventListener('click',()=>go('profile'));

async function postFunction(name,body){
 const r=await fetch(SUPABASE_URL+'/functions/v1/'+name,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify(body)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok||data.error)throw new Error(data.error||('Request failed ('+r.status+')'));
 return data;
}
async function walletApi(action,extra={}){if(!initData)throw new Error('Open the Mini App from @EmpireCoinOfficialBot.');return postFunction('ton-wallet-auth',{action,initData,network:selectedNetwork,...extra})}
async function adminApi(action,payload={}){if(!initData)throw new Error('Telegram session unavailable.');return postFunction('admin-api',{action,initData,payload})}
async function loadMiningStatus(){
 try{
  const result=await postFunction('empc-mining',{action:'status',initData});
  const mining=result.mining||{};
  const balance=Number(mining.balance||0);
  $('earn-status').textContent=mining.enabled?'Engine enabled':'Disabled · launch pending';
  $('earn-daily').textContent=mining.enabled?(mining.previous_cycle_ready?'Cycle prepared':'Awaiting verified activity'):'Not active';
  $('earn-balance').textContent=(Number.isFinite(balance)?balance.toLocaleString(undefined,{maximumFractionDigits:4}):'0')+' EMPC';
 }catch(e){
  $('earn-status').textContent='Status unavailable';
  $('earn-daily').textContent='Not available';
  $('earn-balance').textContent='—';
 }
}

async function startTelegram(){
 const webApp=window.Telegram?.WebApp;
 if(!webApp?.initData){$('session-label').textContent='OPEN IN TELEGRAM';$('wallet-status').textContent='Open this Mini App from the official Telegram bot to connect your account.';return false}
 webApp.ready?.();webApp.expand?.();initData=webApp.initData;
 try{
  const data=await postFunction('telegram-auth',{initData});
  if(!data.ok||!data.telegramUser)throw new Error('Telegram verification failed.');
  telegramUser=data.telegramUser;telegramVerified=true;
  const full=[telegramUser.firstName,telegramUser.lastName].filter(Boolean).join(' ')||'Telegram member';
  const initials=full.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  $('session-label').textContent='SECURE SESSION';$('profile-name').textContent=full;$('profile-username').textContent=telegramUser.username?'@'+telegramUser.username:'Telegram account';$('profile-id').textContent=String(telegramUser.id);$('profile-avatar').textContent=initials;$('menu-profile').textContent=initials;
  $('user-card')?.classList.add('hidden');
  return true;
 }catch(e){$('session-label').textContent='SESSION ERROR';showError('Telegram: '+e.message);return false}
}

async function loadVerifiedWallet(){
 const result=await walletApi('status');const saved=result.wallet;
 verifiedWallet=saved?.verified?saved:null;
 if(verifiedWallet){
  $('wallet-verification').classList.remove('hidden');$('verified-address').textContent=verifiedWallet.wallet_address+' · '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet');
  $('home-wallet').textContent=shortAddress(verifiedWallet.wallet_address);$('profile-wallet').textContent=shortAddress(verifiedWallet.wallet_address);
  $('wallet-status').textContent='Your '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet')+' wallet ownership is verified.';
  setVerifyButton(false);
 }else{
  $('wallet-verification').classList.add('hidden');$('home-wallet').textContent='Not connected';$('profile-wallet').textContent='Not connected';
  setVerifyButton(true);
 }
 return verifiedWallet;
}
async function prepareWalletProof(){
 if(!telegramVerified||!tonUI||verifiedWallet)return;
 tonUI.setConnectRequestParameters({state:'loading'});
 try{const result=await walletApi('payload');tonUI.setConnectRequestParameters({state:'ready',value:{tonProof:result.payload}});$('wallet-status').textContent='Secure ownership challenge ready. Connect your '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet')+' wallet.'}
 catch(e){tonUI.setConnectRequestParameters(null);$('wallet-status').textContent='Could not prepare the wallet verification challenge.';showError('Wallet challenge: '+e.message)}
}
async function verifyConnectedWallet(wallet){
 const proof=wallet?.connectItems?.tonProof;
 if(!proof||!('proof'in proof)){
  if(verifiedWallet&&wallet?.account?.address===verifiedWallet.wallet_address&&wallet?.account?.chain===selectedNetwork){
   $('wallet-status').textContent='Verified '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet')+' wallet: '+shortAddress(verifiedWallet.wallet_address);$('wallet-verification').classList.remove('hidden');setVerifyButton(false);
  }else if(!verifiedWallet){$('wallet-status').textContent='Wallet connected. Ownership still needs verification.';setVerifyButton(true)}
  else{$('wallet-status').textContent='A different wallet is connected. Your previously verified wallet remains on your account.';setVerifyButton(false)}
  return;
 }
 if(verifiedWallet){setVerifyButton(false);return}
 try{
  if(wallet.account.chain!==selectedNetwork)throw new Error('Please connect the selected TON network.');
  $('wallet-status').textContent='Verifying wallet signature securely…';
  const result=await walletApi('verify',{address:wallet.account.address,network:wallet.account.chain,public_key:wallet.account.publicKey,proof:{...proof.proof,state_init:wallet.account.walletStateInit}});
  verifiedWallet=result.wallet;$('wallet-verification').classList.remove('hidden');$('verified-address').textContent=result.wallet.wallet_address+' · '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet');
  $('wallet-status').textContent='Wallet ownership verified successfully.';$('home-wallet').textContent=shortAddress(result.wallet.wallet_address);$('profile-wallet').textContent=shortAddress(result.wallet.wallet_address);
  setVerifyButton(false);clearError();toast((selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet')+' wallet verified.');
 }catch(e){$('wallet-status').textContent='Wallet ownership verification failed.';setVerifyButton(!verifiedWallet);showError('Wallet proof: '+e.message)}
}
async function reconnectForProof(){
 if(!telegramVerified||!tonUI||proofBusy||verifiedWallet)return;
 proofBusy=true;setVerifyButton(true);$('verify-wallet-button').disabled=true;clearError();
 try{await prepareWalletProof();if(tonUI.connected)await tonUI.disconnect();await tonUI.openModal()}
 catch(e){showError('Reconnect: '+e.message)}
 finally{proofBusy=false;setVerifyButton(!verifiedWallet)}
}
async function startWallet(){
 try{
  const {TonConnectUI}=await import('https://esm.sh/@tonconnect/ui@2.3.0');
  tonUI=new TonConnectUI({manifestUrl:new URL('./tonconnect-manifest.json',window.location.href).href,buttonRootId:'ton-connect'});
  tonUI.connector.setConnectionNetwork(selectedNetwork);
  tonUI.onStatusChange(async wallet=>{
   if(!wallet){
    if(verifiedWallet){$('wallet-status').textContent='Verified wallet saved to your account: '+shortAddress(verifiedWallet.wallet_address);$('wallet-verification').classList.remove('hidden');setVerifyButton(false)}
    else{$('wallet-status').textContent=telegramVerified?'No TON wallet connected.':'Verify Telegram first.';setVerifyButton(telegramVerified)}
    return;
   }
   const addr=wallet.account?.address;
   if(verifiedWallet&&addr===verifiedWallet.wallet_address&&wallet.account?.chain===selectedNetwork){
    $('wallet-status').textContent='Verified '+(selectedNetwork===MAINNET_CHAIN?'TON Mainnet':'TON Testnet')+' wallet: '+shortAddress(addr);$('wallet-verification').classList.remove('hidden');setVerifyButton(false);return;
   }
   if(verifiedWallet){$('wallet-status').textContent='Another wallet is connected. Your verified wallet remains '+shortAddress(verifiedWallet.wallet_address)+'.';setVerifyButton(false);return}
   $('wallet-status').textContent='Connected · '+(wallet.account?.chain===MAINNET_CHAIN?'TON Mainnet':wallet.account?.chain===TESTNET_CHAIN?'TON Testnet':'Other network')+' · '+shortAddress(addr);
   if(telegramVerified)await verifyConnectedWallet(wallet);
  });
  if(telegramVerified){await loadVerifiedWallet();if(!verifiedWallet)await prepareWalletProof()}
 }catch(e){$('wallet-status').textContent='Wallet connector could not load. Other sections remain available.';showError('TON Connect: '+e.message)}
}

function fillMining(m){
 $('cfg-base').value=m.daily_base_reward??0;$('cfg-referral').value=m.referral_daily_bonus??0;$('cfg-max-referrals').value=m.max_rewarded_referrals??0;$('cfg-speed').value=m.max_speed_multiplier??1;$('cfg-user-cap').value=m.per_user_daily_cap??0;$('cfg-global-cap').value=m.global_daily_budget??0;
 $('earn-status').textContent=m.mining_enabled?'Flag enabled · reward engine pending':'Disabled';
}
function renderAdmins(list,actor){
 const box=$('admin-list');box.replaceChildren();
 (list||[]).forEach(a=>{
  const row=document.createElement('div');row.className='admin-person';
  const info=document.createElement('div');const name=document.createElement('b');name.textContent=String(a.telegram_user_id)+(a.telegram_user_id===actor?' · You':'');
  const meta=document.createElement('small');meta.textContent=a.role.toUpperCase()+' · '+(a.is_active?'ACTIVE':'INACTIVE');
  info.append(name,meta);row.append(info);
  if(a.role!=='owner'&&a.is_active){const btn=document.createElement('button');btn.textContent='Deactivate';btn.addEventListener('click',()=>deactivateAdmin(a.telegram_user_id));row.append(btn)}
  box.append(row);
 });
 if(!box.children.length)box.textContent='No administrator records returned.';
}
async function loadAdmin(){
 $('admin-loading').textContent='Checking administrator permissions…';
 try{
  const data=await adminApi('dashboard');adminData=data;$('admin-loading').classList.add('hidden');$('admin-content').classList.remove('hidden');$('admin-nav').classList.remove('hidden');
  $('admin-role').textContent=(data.admin?.role||'ADMIN').toUpperCase();$('admin-id').textContent='Telegram ID: '+data.admin.telegram_user_id;
  fillMining(data.mining||{});renderAdmins(data.admins||[],telegramUser.id);
  $('admin-management').classList.toggle('hidden',!data.admin.can_manage_admins);
 }catch(e){$('admin-loading').classList.add('hidden');$('admin-nav').classList.add('hidden');$('admin-content').classList.add('hidden')}
}
async function saveMining(){
 const payload={daily_base_reward:Number($('cfg-base').value),referral_daily_bonus:Number($('cfg-referral').value),max_rewarded_referrals:Number($('cfg-max-referrals').value),max_speed_multiplier:Number($('cfg-speed').value),per_user_daily_cap:Number($('cfg-user-cap').value),global_daily_budget:Number($('cfg-global-cap').value),mining_enabled:false,referrals_enabled:false};
 if(Object.values(payload).some(v=>typeof v==='number'&&(!Number.isFinite(v)||v<0))||payload.max_speed_multiplier<1){toast('Check the settings values.');return}
 try{const result=await adminApi('update_mining',payload);fillMining(result.mining);toast('Reward settings saved. Mining and referrals remain disabled.')}
 catch(e){showError('Admin settings: '+e.message)}
}
async function addAdmin(){
 const id=Number($('new-admin-id').value);if(!Number.isSafeInteger(id)||id<=0){toast('Enter a valid Telegram ID.');return}
 try{await adminApi('add_admin',{telegram_user_id:id});$('new-admin-id').value='';await loadAdmin();toast('Administrator added.')}
 catch(e){showError('Add administrator: '+e.message)}
}
async function deactivateAdmin(id){
 if(!confirm('Deactivate administrator '+id+'?'))return;
 try{await adminApi('deactivate_admin',{telegram_user_id:id});await loadAdmin();toast('Administrator deactivated.')}
 catch(e){showError('Deactivate administrator: '+e.message)}
}
$('verify-wallet-button').addEventListener('click',reconnectForProof);
$('wallet-network').addEventListener('change',e=>{selectedNetwork=e.target.value;});
$('switch-wallet-network').addEventListener('click',async()=>{
 try{clearError();if(tonUI?.connected)await tonUI.disconnect();tonUI?.connector?.setConnectionNetwork(selectedNetwork);verifiedWallet=null;await loadVerifiedWallet();if(!verifiedWallet)await prepareWalletProof();$('wallet-network-label').textContent=selectedNetwork===MAINNET_CHAIN?'TON MAINNET SELECTED':'TON TESTNET SELECTED';toast('Network selection updated.');}
 catch(e){showError('Network switch: '+e.message)}
});
$('save-settings').addEventListener('click',saveMining);$('add-admin').addEventListener('click',addAdmin);
window.addEventListener('error',e=>{if(e.message)showError('App error: '+e.message)});
window.addEventListener('unhandledrejection',e=>showError('Startup error: '+(e.reason?.message||String(e.reason))));
async function initialize(){
 const ok=await startTelegram();
 if(!ok)return;
 await Promise.all([startWallet(),loadAdmin(),loadMiningStatus()]);
}
initialize();