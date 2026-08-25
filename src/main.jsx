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

// The service worker now activates a new version immediately on install
// (skipWaiting + clientsClaim in src/sw.js) instead of waiting for every
// tab to close -- this is the other half: once that handoff happens,
// reload once so the page actually shows the new version instead of
// running old JS under a new worker. Reload-in-progress ref guards
// against the rare double-fire some browsers do.
//
// A magic-link redirect lands on `origin/?code=...`; Supabase's PKCE flow
// then asynchronously exchanges that single-use code for a session and
// only strips it from the URL (via history.replaceState) once that
// exchange finishes. Reloading while `code` is still in the URL would
// either burn the code on a second exchange attempt or interrupt the first
// one outright, so this waits for it to clear (or a timeout, in case the
// exchange itself fails) before reloading.
function hasPendingAuthRedirect() {
  return /[?&]code=/.test(window.location.search) || /access_token=/.test(window.location.hash)
}

if ('serviceWorker' in navigator) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    if (!hasPendingAuthRedirect()) {
      window.location.reload()
      return
    }
    const start = Date.now()
    const waitForAuthExchange = setInterval(() => {
      if (!hasPendingAuthRedirect() || Date.now() - start > 8000) {
        clearInterval(waitForAuthExchange)
        window.location.reload()
      }
    }, 200)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
