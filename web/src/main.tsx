import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { initTags } from './analytics/tags'

// Outside the render so it happens once, rather than twice under StrictMode's
// double-invoked effects. It loads nothing unless a tracking ID is configured
// and the visitor has already accepted; otherwise it just subscribes and waits.
initTags()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
