import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    const pkey = process.env.PRIVATE_KEY;

    if (!pkey || pkey === "your_dev_wallet_private_key_here") {
      return res.status(500).json({ error: "Missing PRIVATE_KEY environment variable. Add it to Vercel dashboard." });
    }

    if (!data.wallet || data.level === undefined || data.level < 0 || data.level > 4) {
      return res.status(400).json({ error: "Invalid wallet or level (0-4)" });
    }

    const contractsConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/constants/contracts.json'), 'utf8'));
    const abis = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/constants/abis.json'), 'utf8'));

    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const signer = new ethers.Wallet(pkey, provider);
    const registry = new ethers.Contract(contractsConfig.VOLUND_REGISTRY, abis.VolundRegistry, signer);

    console.log(`Syncing PoH Level ${data.level} for:`, data.wallet);

    const tx = await registry.updatePohLevel(data.wallet, data.level);

    return res.status(200).json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("PoH sync failed:", err);
    return res.status(500).json({ error: err.message });
  }
}
