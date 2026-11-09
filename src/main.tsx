import React from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './styles.css'

// Versioned manifest URL forces wallets to fetch the corrected dApp identity.
const manifestUrl = 'https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-manifest-v2.json'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
)
