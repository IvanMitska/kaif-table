import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Reset zoom on mobile devices
if ('visualViewport' in window) {
  const resetZoom = () => {
    const viewport = window.visualViewport
    if (viewport && viewport.scale !== 1) {
      document.body.style.transform = 'scale(1)'
      document.body.style.transformOrigin = '0 0'
    }
  }
  window.visualViewport?.addEventListener('resize', resetZoom)
  resetZoom()
}

// Prevent pinch zoom
document.addEventListener('gesturestart', (e) => e.preventDefault())
document.addEventListener('gesturechange', (e) => e.preventDefault())
document.addEventListener('gestureend', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
