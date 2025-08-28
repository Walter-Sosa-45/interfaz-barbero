import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertProvider } from './components/AlertContext'
import './index.css'
import './main.css'
import App from './App.jsx'


// ...existing code...

// Registrar el Service Worker
// ...existing code...

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </StrictMode>,
)
