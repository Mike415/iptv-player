import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// iOS Safari Back/Forward Cache (bfcache) fix:
// When iOS restores a page from bfcache, the JS state is stale.
// Force a full reload to reinitialize the app cleanly.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from bfcache — force a fresh load
    window.location.reload()
  }
})

// Blank page recovery:
// If the page becomes visible and the root element has no content
// (can happen after iOS suspends and resumes the tab), force reload.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const root = document.getElementById('root')
    if (root && root.childElementCount === 0) {
      window.location.reload()
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
