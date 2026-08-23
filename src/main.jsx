import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// VITE_SENTRY_DSN is unset in local dev, so Sentry.init() with an empty
// dsn is a documented no-op -- errors just aren't reported, nothing throws.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})

function ErrorFallback() {
  return (
    <div style={{ minHeight: '100svh', background: '#0F0B1A', color: '#F5F0FF', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: '0.5px' }}>Something went wrong</div>
      <p style={{ fontSize: 14, color: '#8B85A3', maxWidth: 320 }}>Prism hit an unexpected error. Reloading usually fixes it.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: 8, background: 'linear-gradient(90deg, #3DF2E0, #9D6BFF)', border: 'none', borderRadius: 10, padding: '12px 24px', color: '#0F0B1A', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
      >
        Reload
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
