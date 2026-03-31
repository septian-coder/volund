import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from './App.jsx'

import { ThemeProvider } from './context/ThemeContext';
import { ReputationProvider } from './context/ReputationProvider';
import { Web3Provider } from './providers/Web3Provider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3Provider>
      <ThemeProvider>
        <ReputationProvider>
          <Root />
        </ReputationProvider>
      </ThemeProvider>
    </Web3Provider>
  </StrictMode>,
)
