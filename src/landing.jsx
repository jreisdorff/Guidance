import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Landing } from './components/Landing.jsx'
import { I18nProvider } from './i18n.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <Landing />
    </I18nProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
