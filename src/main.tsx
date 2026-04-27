import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { GoogleProvider } from './components/GoogleProvider'
import './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <GoogleProvider>
        <App />
      </GoogleProvider>
    </ThemeProvider>
  </StrictMode>,
)
