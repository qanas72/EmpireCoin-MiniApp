import React from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import NovaApp from './NovaApp'
import './nova.css'

const root = document.getElementById('nova-root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <TonConnectUIProvider manifestUrl="https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-manifest-v2.json">
        <NovaApp />
      </TonConnectUIProvider>
    </React.StrictMode>,
  )
}
