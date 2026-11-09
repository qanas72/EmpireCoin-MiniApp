import React from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './styles.css'

// Show a readable diagnostic instead of leaving a blank dark screen.
function showBootError(reason: unknown) {
  const root = document.getElementById('root')
  if (!root) return
  const message = reason instanceof Error ? reason.message : String(reason)
  root.innerHTML = ''
  const panel = document.createElement('div')
  panel.style.cssText = 'max-width:520px;margin:12vh auto;padding:24px;color:#eaf5ff;background:#101d32;border:1px solid #d6b66d;border-radius:14px;font:14px/1.7 Arial,sans-serif;overflow-wrap:anywhere'
  const heading = document.createElement('h2')
  heading.textContent = 'EmpireCoin could not start'
  const detail = document.createElement('pre')
  detail.style.cssText = 'white-space:pre-wrap;color:#ffd58a;font:12px/1.6 monospace'
  detail.textContent = message.slice(0, 1200)
  const hint = document.createElement('p')
  hint.textContent = 'Please send this error message to EmpireCoin support. Do not connect a wallet or approve a transaction.'
  panel.append(heading, detail, hint)
  root.append(panel)
}

window.addEventListener('error', (event) => {
  showBootError(event.error || event.message || 'Unknown JavaScript loading error')
})
window.addEventListener('unhandledrejection', (event) => {
  showBootError(event.reason || 'Unhandled application error')
})

// Versioned manifest URL forces wallets to fetch the corrected dApp identity.
const manifestUrl = 'https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-manifest-v2.json'
const root = document.getElementById('root')
if (root) root.textContent = 'Starting EmpireCoin…'

try {
  ReactDOM.createRoot(root!).render(
    <React.StrictMode>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <App />
      </TonConnectUIProvider>
    </React.StrictMode>,
  )
} catch (error) {
  showBootError(error)
}
