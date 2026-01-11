import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root') || document.createElement('div')
if (!rootEl.id) {
  rootEl.id = 'root'
  document.body.appendChild(rootEl)
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
