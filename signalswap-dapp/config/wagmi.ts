import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains'; // or any chain(s) you want; don't leave empty

// For now, hardcode if .env is not in use (get real ID from https://cloud.walletconnect.com)
const projectId = 'paste_your_real_64_char_project_id_here'; // ← critical!

if (!projectId) {
  throw new Error('WalletConnect projectId is required – get one free at https://cloud.walletconnect.com');
}

export default getDefaultConfig({
  appName: 'signalswap',
  projectId,
  chains: [polygon],   // ← must include at least one chain
  ssr: true,           // prevents hydration mismatches in Next.js
  // Optional: custom RPC if public ones are rate-limited
  // transports: { [polygon.id]: http('https://polygon-rpc.com') },
});