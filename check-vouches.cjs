async function checkVouches() {
  const { ethers } = await import("ethers");
  const address = "0xBa52b005184c673108c5BDC68A9933115efbFB6B";
  const VOUCH_CONTRACT = "0x9ED3D69B662a9A24A9B6a29C2B757a0975Fc050E";
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  const contract = new ethers.Contract(VOUCH_CONTRACT, [
    "function getVouches(address) view returns (address[])",
    "function mapping(address => mapping(address => bool)) public hasVouched"
  ], provider);

  try {
    const vouches = await contract.getVouches(address);
    console.log(`Vouches received by ${address}:`, vouches);
    
    // Also check if they HAVE vouched for someone else (just to be sure)
    // NOTE: public mapping check won't work easily here because it's double mapping
  } catch (err) {
    console.error("Query failed:", err.message);
  }
}
checkVouches();
