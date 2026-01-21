import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css' // 👈 IMPORTANT: Ensure this matches the file name exactly
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)