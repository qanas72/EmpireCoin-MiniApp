import { Buffer } from 'buffer'

// TON libraries expect the Node.js Buffer global, which browser WebViews do not provide.
;(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import NovaApp from './NovaApp'
import './nova.css'

class NovaErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EmpireCoin Nova render failed:', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      return <main style={{maxWidth:520,margin:'12vh auto',padding:24,color:'#29251e',background:'#fffaf0',border:'1px solid #c49a46',borderRadius:14,font:'14px/1.7 Arial',overflowWrap:'anywhere'}}>
        <h2>EmpireCoin Nova could not start</h2>
        <pre style={{whiteSpace:'pre-wrap',color:'#8a6422',fontSize:12}}>{this.state.error.slice(0,1200)}</pre>
        <p>Send this error to EmpireCoin support. Do not approve any wallet transaction.</p>
      </main>
    }
    return this.props.children
  }
}

const root = document.getElementById('nova-root')
if (!root) {
  document.body.textContent = 'EmpireCoin Nova: app root element was not found.'
} else {
  root.dataset.scriptLoaded = 'true'
  window.addEventListener('error', (event) => {
    console.error('EmpireCoin Nova browser error:', event.error || event.message)
    if (!root.dataset.reactMounted) {
      root.innerHTML = '<p style="padding:24px;color:#8a6422">EmpireCoin Nova could not load a required file. Please send a screenshot to support.</p>'
    }
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('EmpireCoin Nova rejected promise:', event.reason)
  })
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <NovaErrorBoundary>
          <TonConnectUIProvider manifestUrl="https://qanas72.github.io/EmpireCoin-MiniApp/tonconnect-manifest-v2.json">
            <NovaApp />
          </TonConnectUIProvider>
        </NovaErrorBoundary>
      </React.StrictMode>,
    )
  } catch (error) {
    root.textContent = 'EmpireCoin Nova startup error: ' + (error instanceof Error ? error.message : String(error))
  }
}
