import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/roboto-mono'
import App from './App.jsx'
import Showcase from './kadro/Showcase.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {location.search.includes('kadro') ? <Showcase /> : <App />}
  </StrictMode>,
)
