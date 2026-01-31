import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
<<<<<<< Updated upstream
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
=======
import AppRoutes from './AppRoutes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
>>>>>>> Stashed changes
  </StrictMode>,
)
