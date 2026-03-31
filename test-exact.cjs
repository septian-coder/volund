async function testExactName() {
  const { ethers } = await import("ethers");
  const address = "0xBa52b005184c673108c5BDC68A9933115efbFB6B";
  const checksumAddr = ethers.getAddress(address);
  const BASENAME_NFT = ethers.getAddress("0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a");
  const baseProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");

  try {
    const nft = new ethers.Contract(BASENAME_NFT, [
      "function balanceOf(address) view returns(uint256)",
      "function tokenOfOwnerByIndex(address, uint256) view returns(uint256)",
      "function tokenURI(uint256) view returns(string)"
    ], baseProvider);

    console.log("Fetching balance...");
    const balance = await nft.balanceOf(checksumAddr);
    console.log("Balance:", balance.toString());

    if (balance > 0n) {
      console.log("Fetching tokenId at index 0...");
      const tokenId = await nft.tokenOfOwnerByIndex(checksumAddr, 0);
      console.log("Token ID:", tokenId.toString());

      console.log("Fetching tokenURI...");
      const uri = await nft.tokenURI(tokenId);
      
      // The URI might be an IPFS link, a JSON URL, or base64 encoded JSON
      if (uri.startsWith("data:application/json;base64,")) {
        const jsonString = Buffer.from(uri.replace("data:application/json;base64,", ""), "base64").toString();
        const metadata = JSON.parse(jsonString);
        console.log("Exact Name from Metadata:", metadata.name);
      } else {
        console.log("Raw URI:", uri);
      }
    }
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
testExactName();
