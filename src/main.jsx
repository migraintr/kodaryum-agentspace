import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/roboto-mono'
import App from './App.jsx'
import './index.css'

// Çalışan portresi (?kadro=portre): karakter modellerini önden incelemek için ayrı sahne
const Portrait = lazy(() => import('./kadro/Portrait.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {location.search.includes('kadro=portre') ? (
      <Suspense fallback={null}>
        <Portrait />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
