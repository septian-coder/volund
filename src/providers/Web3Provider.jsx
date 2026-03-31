import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';

const config = getDefaultConfig({
  appName: 'Volund Reputation',
  projectId: 'fc1eade44db55a539b0368df7e6c3821', // Free public WalletConnect template ID
  chains: [baseSepolia],
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  // Use a simple check, this provider wraps ThemeProvider later so we might need strict React contexts.
  // Actually, Web3Provider will WRAP ThemeProvider, so we can't use useTheme() directly inside it yet!
  // We'll just define the structural wrapper. Theme propagation for Rainbowkit happens via DOM classes usually, or we can pass it manually later.
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#a9ddd3', accentColorForeground: '#010101' })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
