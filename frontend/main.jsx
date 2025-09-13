import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './src/App'
import KombaiWrapper from './KombaiWrapper'
import ErrorBoundary from './ErrorBoundary'
import './src/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <KombaiWrapper>
        <App />
      </KombaiWrapper>
    </ErrorBoundary>
  </StrictMode>,
)
