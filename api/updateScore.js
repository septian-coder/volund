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

    const contractsConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/constants/contracts.json'), 'utf8'));
    const abis = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/constants/abis.json'), 'utf8'));

    const rpcUrl = "https://sepolia.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(pkey, provider);
    const oracle = new ethers.Contract(contractsConfig.VOLUND_SCORE_ORACLE, abis.VolundScoreOracle, signer);

    console.log("Relaying score update for:", data.wallet);
    
    const tx = await oracle.updateScore(
      data.wallet,
      data.total || 0,
      data.onchain || 0,
      data.defi || 0,
      data.identity || 0,
      data.social || 0,
      data.badges || 0
    );
    
    return res.status(200).json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Relayer execution failed:", err);
    return res.status(500).json({ error: err.message });
  }
}
