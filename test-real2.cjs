async function testReal() {
  const { ethers } = await import("ethers");
  const address = "0xBa52b005184c673108c5BDC68A9933115efbFB6B";
  const checksumAddr = ethers.getAddress(address);
  
  // Create strictly valid checksums for the contracts from purely lowercase
  const BASENAME_NFT = ethers.getAddress("0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a");
  const L2_RESOLVER = ethers.getAddress("0xc6d566a56a1aff6508b41f6c90ff131615583bcd");

  console.log("Testing for user:", checksumAddr);
  console.log("NFT contract:", BASENAME_NFT);

  const baseProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");

  // Test 1: NFT Balance
  try {
    const nft = new ethers.Contract(BASENAME_NFT, ["function balanceOf(address) view returns(uint256)"], baseProvider);
    const balance = await nft.balanceOf(checksumAddr);
    console.log("NFT Balance:", balance.toString());
  } catch (e) {
    console.error("NFT check failed:", e.message);
  }

  // Test 2: L2 Resolver reverse
  try {
    const addrLower = checksumAddr.toLowerCase().replace("0x", "");
    const reverseNode = ethers.namehash(addrLower + ".addr.reverse");
    const resolver = new ethers.Contract(L2_RESOLVER, ["function name(bytes32) view returns(string)"], baseProvider);
    const name = await resolver.name(reverseNode);
    console.log("L2 Resolver reverse string:", name);
  } catch (e) {
    console.error("L2 Resolver failed:", e.message);
  }
}
testReal();
