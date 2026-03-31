// vite.config.js
import { defineConfig } from "file:///C:/Users/SLIM%203/.gemini/antigravity/scratch/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/SLIM%203/.gemini/antigravity/scratch/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/SLIM%203/.gemini/antigravity/scratch/node_modules/vite-plugin-pwa/dist/index.js";
import * as dotenv from "file:///C:/Users/SLIM%203/.gemini/antigravity/scratch/node_modules/dotenv/lib/main.js";
import fs from "fs";
import path from "path";
import { ethers } from "file:///C:/Users/SLIM%203/.gemini/antigravity/scratch/node_modules/ethers/lib.esm/index.js";
var __vite_injected_original_dirname = "C:\\Users\\SLIM 3\\.gemini\\antigravity\\scratch";
dotenv.config({ path: path.resolve(__vite_injected_original_dirname, "contracts/.env") });
function scoreRelayerPlugin() {
  return {
    name: "score-relayer",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/updateScore" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => body += chunk.toString());
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              const pkey = process.env.PRIVATE_KEY;
              if (!pkey || pkey === "your_dev_wallet_private_key_here") {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: "Missing or invalid PRIVATE_KEY in contracts/.env" }));
              }
              const contractsConfig = JSON.parse(fs.readFileSync(path.resolve(__vite_injected_original_dirname, "src/constants/contracts.json"), "utf8"));
              const abis = JSON.parse(fs.readFileSync(path.resolve(__vite_injected_original_dirname, "src/constants/abis.json"), "utf8"));
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
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, txHash: tx.hash }));
            } catch (err) {
              console.error("Relayer execution failed:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    scoreRelayerPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Volund Reputation Score",
        short_name: "Volund RRS",
        description: "Native onchain reputation system for the Rialo ecosystem.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon"
          }
        ]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTTElNIDNcXFxcLmdlbWluaVxcXFxhbnRpZ3Jhdml0eVxcXFxzY3JhdGNoXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTTElNIDNcXFxcLmdlbWluaVxcXFxhbnRpZ3Jhdml0eVxcXFxzY3JhdGNoXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TTElNJTIwMy8uZ2VtaW5pL2FudGlncmF2aXR5L3NjcmF0Y2gvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSdcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZXRoZXJzIH0gZnJvbSAnZXRoZXJzJ1xuXG4vLyBMb2FkIERldiBXYWxsZXQgZnJvbSBjb250cmFjdHMgZGlyZWN0bHlcbmRvdGVudi5jb25maWcoeyBwYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnY29udHJhY3RzLy5lbnYnKSB9KVxuXG5mdW5jdGlvbiBzY29yZVJlbGF5ZXJQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3Njb3JlLXJlbGF5ZXInLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGlmIChyZXEudXJsID09PSAnL2FwaS91cGRhdGVTY29yZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICAgIGNvbnN0IHBrZXkgPSBwcm9jZXNzLmVudi5QUklWQVRFX0tFWTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmICghcGtleSB8fCBwa2V5ID09PSBcInlvdXJfZGV2X3dhbGxldF9wcml2YXRlX2tleV9oZXJlXCIpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIk1pc3Npbmcgb3IgaW52YWxpZCBQUklWQVRFX0tFWSBpbiBjb250cmFjdHMvLmVudlwiIH0pKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIExvYWQgZHluYW1pY2FsbHlcbiAgICAgICAgICAgICAgY29uc3QgY29udHJhY3RzQ29uZmlnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9jb25zdGFudHMvY29udHJhY3RzLmpzb24nKSwgJ3V0ZjgnKSk7XG4gICAgICAgICAgICAgIGNvbnN0IGFiaXMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2NvbnN0YW50cy9hYmlzLmpzb24nKSwgJ3V0ZjgnKSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBTdGFuZGFyZCBSUEMgZmFsbGJhY2tcbiAgICAgICAgICAgICAgY29uc3QgcnBjVXJsID0gXCJodHRwczovL3NlcG9saWEuYmFzZS5vcmdcIjtcbiAgICAgICAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgZXRoZXJzLkpzb25ScGNQcm92aWRlcihycGNVcmwpO1xuICAgICAgICAgICAgICBjb25zdCBzaWduZXIgPSBuZXcgZXRoZXJzLldhbGxldChwa2V5LCBwcm92aWRlcik7XG4gICAgICAgICAgICAgIGNvbnN0IG9yYWNsZSA9IG5ldyBldGhlcnMuQ29udHJhY3QoY29udHJhY3RzQ29uZmlnLlZPTFVORF9TQ09SRV9PUkFDTEUsIGFiaXMuVm9sdW5kU2NvcmVPcmFjbGUsIHNpZ25lcik7XG5cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWxheWluZyBzY29yZSB1cGRhdGUgZm9yOlwiLCBkYXRhLndhbGxldCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBjb25zdCB0eCA9IGF3YWl0IG9yYWNsZS51cGRhdGVTY29yZShcbiAgICAgICAgICAgICAgICBkYXRhLndhbGxldCxcbiAgICAgICAgICAgICAgICBkYXRhLnRvdGFsIHx8IDAsXG4gICAgICAgICAgICAgICAgZGF0YS5vbmNoYWluIHx8IDAsXG4gICAgICAgICAgICAgICAgZGF0YS5kZWZpIHx8IDAsXG4gICAgICAgICAgICAgICAgZGF0YS5pZGVudGl0eSB8fCAwLFxuICAgICAgICAgICAgICAgIGRhdGEuc29jaWFsIHx8IDAsXG4gICAgICAgICAgICAgICAgZGF0YS5iYWRnZXMgfHwgMFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHR4SGFzaDogdHguaGFzaCB9KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlJlbGF5ZXIgZXhlY3V0aW9uIGZhaWxlZDpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHNjb3JlUmVsYXllclBsdWdpbigpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnVm9sdW5kIFJlcHV0YXRpb24gU2NvcmUnLFxuICAgICAgICBzaG9ydF9uYW1lOiAnVm9sdW5kIFJSUycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTmF0aXZlIG9uY2hhaW4gcmVwdXRhdGlvbiBzeXN0ZW0gZm9yIHRoZSBSaWFsbyBlY29zeXN0ZW0uJyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2Zhdmljb24uaWNvJyxcbiAgICAgICAgICAgIHNpemVzOiAnNjR4NjQnLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3gtaWNvbidcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9KVxuICBdLFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVUsU0FBUyxvQkFBb0I7QUFDOVYsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixZQUFZLFlBQVk7QUFDeEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsY0FBYztBQU52QixJQUFNLG1DQUFtQztBQVNsQyxjQUFPLEVBQUUsTUFBTSxLQUFLLFFBQVEsa0NBQVcsZ0JBQWdCLEVBQUUsQ0FBQztBQUVqRSxTQUFTLHFCQUFxQjtBQUM1QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBUTtBQUN0QixhQUFPLFlBQVksSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO0FBQy9DLFlBQUksSUFBSSxRQUFRLHNCQUFzQixJQUFJLFdBQVcsUUFBUTtBQUMzRCxjQUFJLE9BQU87QUFDWCxjQUFJLEdBQUcsUUFBUSxXQUFTLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFDaEQsY0FBSSxHQUFHLE9BQU8sWUFBWTtBQUN4QixnQkFBSTtBQUNGLG9CQUFNLE9BQU8sS0FBSyxNQUFNLElBQUk7QUFDNUIsb0JBQU0sT0FBTyxRQUFRLElBQUk7QUFFekIsa0JBQUksQ0FBQyxRQUFRLFNBQVMsb0NBQW9DO0FBQ3hELG9CQUFJLGFBQWE7QUFDakIsdUJBQU8sSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sbURBQW1ELENBQUMsQ0FBQztBQUFBLGNBQzlGO0FBR0Esb0JBQU0sa0JBQWtCLEtBQUssTUFBTSxHQUFHLGFBQWEsS0FBSyxRQUFRLGtDQUFXLDhCQUE4QixHQUFHLE1BQU0sQ0FBQztBQUNuSCxvQkFBTSxPQUFPLEtBQUssTUFBTSxHQUFHLGFBQWEsS0FBSyxRQUFRLGtDQUFXLHlCQUF5QixHQUFHLE1BQU0sQ0FBQztBQUduRyxvQkFBTSxTQUFTO0FBQ2Ysb0JBQU0sV0FBVyxJQUFJLE9BQU8sZ0JBQWdCLE1BQU07QUFDbEQsb0JBQU0sU0FBUyxJQUFJLE9BQU8sT0FBTyxNQUFNLFFBQVE7QUFDL0Msb0JBQU0sU0FBUyxJQUFJLE9BQU8sU0FBUyxnQkFBZ0IscUJBQXFCLEtBQUssbUJBQW1CLE1BQU07QUFFdEcsc0JBQVEsSUFBSSw4QkFBOEIsS0FBSyxNQUFNO0FBRXJELG9CQUFNLEtBQUssTUFBTSxPQUFPO0FBQUEsZ0JBQ3RCLEtBQUs7QUFBQSxnQkFDTCxLQUFLLFNBQVM7QUFBQSxnQkFDZCxLQUFLLFdBQVc7QUFBQSxnQkFDaEIsS0FBSyxRQUFRO0FBQUEsZ0JBQ2IsS0FBSyxZQUFZO0FBQUEsZ0JBQ2pCLEtBQUssVUFBVTtBQUFBLGdCQUNmLEtBQUssVUFBVTtBQUFBLGNBQ2pCO0FBRUEsa0JBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELGtCQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUFBLFlBQzVELFNBQVMsS0FBSztBQUNaLHNCQUFRLE1BQU0sNkJBQTZCLEdBQUc7QUFDOUMsa0JBQUksYUFBYTtBQUNqQixrQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sSUFBSSxRQUFRLENBQUMsQ0FBQztBQUFBLFlBQ2hEO0FBQUEsVUFDRixDQUFDO0FBQ0Q7QUFBQSxRQUNGO0FBQ0EsYUFBSztBQUFBLE1BQ1AsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixtQkFBbUI7QUFBQSxJQUNuQixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsYUFBYTtBQUFBLE1BQzdCLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
