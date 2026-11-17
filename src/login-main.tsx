import { createRoot } from 'react-dom/client'
import { LoginPage } from './pages/LoginPage.js'
import { setupTheme } from './app/theme.js'
import './app/theme.css'
import './app/global.css'

setupTheme()

createRoot(document.getElementById('root') as HTMLElement).render(<LoginPage />)
