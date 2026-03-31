// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VolundBadge is ERC721, Ownable {
    enum BurnAuth { IssuerOnly, OwnerOnly, Both, Neither }

    struct BadgeData {
        uint8 rarity;
        string badgeId;
        uint256 mintedAt;
        uint256 expiresAt;
        bool active;
    }

    uint256 private _tokenIdCounter;

    mapping(address => mapping(string => uint256)) public walletBadge;
    mapping(uint256 => BadgeData) public badgeData;
    mapping(string => uint256) public badgeCost;
    mapping(address => mapping(string => bool)) public hasClaimed;

    event Issued(
        address indexed to,
        uint256 indexed tokenId,
        string badgeId,
        uint8 rarity
    );

    constructor() ERC721("VolundBadge", "VLDB") Ownable(msg.sender) {
        badgeCost["first_tx"]     = 0.0001 ether;
        badgeCost["defi_dabbler"] = 0.0005 ether;
        badgeCost["ens_holder"]   = 0.0002 ether;
        badgeCost["dao_voter"]    = 0.001 ether;
        badgeCost["og_connector"] = 0.0002 ether;
    }

    function claimBadge(string calldata badgeId, uint8 rarity)
        external payable
    {
        require(!hasClaimed[msg.sender][badgeId], "Already claimed");
        require(msg.value >= badgeCost[badgeId], "Insufficient payment");

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(msg.sender, tokenId);

        badgeData[tokenId] = BadgeData({
            rarity: rarity,
            badgeId: badgeId,
            mintedAt: block.timestamp,
            expiresAt: rarity == 0 ? block.timestamp + 365 days : 0,
            active: true
        });

        walletBadge[msg.sender][badgeId] = tokenId;
        hasClaimed[msg.sender][badgeId] = true;

        emit Issued(msg.sender, tokenId, badgeId, rarity);
    }

    function renewBadge(string calldata badgeId) external payable {
        uint256 tokenId = walletBadge[msg.sender][badgeId];
        require(tokenId != 0, "Badge not owned");
        require(msg.value >= badgeCost[badgeId] / 2, "Insufficient payment");

        BadgeData storage badge = badgeData[tokenId];
        badge.expiresAt = block.timestamp + 365 days;
        badge.active = true;
    }

    // SOULBOUND — block all transfers
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) { // Revert transfers, allow minting
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    function getBadges(address wallet)
        external view returns (string[] memory)
    {
        string[] memory known = new string[](5);
        known[0] = "first_tx";
        known[1] = "defi_dabbler";
        known[2] = "ens_holder";
        known[3] = "dao_voter";
        known[4] = "og_connector";

        uint8 count = 0;
        for (uint8 i = 0; i < known.length; i++) {
            if (hasClaimed[wallet][known[i]]) count++;
        }

        string[] memory result = new string[](count);
        uint8 idx = 0;
        for (uint8 i = 0; i < known.length; i++) {
            if (hasClaimed[wallet][known[i]]) {
                result[idx++] = known[i];
            }
        }
        return result;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
