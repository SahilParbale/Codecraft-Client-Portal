import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'
import { registerSW } from './utils/pwaRegister'

// Register Service Worker for PWA (offline support, fast PC loading, installability)
registerSW();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
