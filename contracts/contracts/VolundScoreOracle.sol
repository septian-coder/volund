// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VolundScoreOracle {
    struct Score {
        uint16 total;
        uint16 onchain;
        uint16 defi;
        uint16 identity;
        uint16 social;
        uint16 badges;
        uint256 lastUpdated;
    }

    mapping(address => Score) public scores;
    mapping(address => bool) public authorizedRelayers;
    address public owner;

    event ScoreUpdated(
        address indexed wallet,
        uint16 newScore,
        uint256 timestamp
    );

    modifier onlyRelayer() {
        require(
            authorizedRelayers[msg.sender] || msg.sender == owner,
            "Not authorized relayer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedRelayers[msg.sender] = true;
    }

    function updateScore(
        address wallet,
        uint16 total,
        uint16 onchain,
        uint16 defi,
        uint16 identity,
        uint16 social,
        uint16 badges
    ) external onlyRelayer {
        scores[wallet] = Score({
            total: total,
            onchain: onchain,
            defi: defi,
            identity: identity,
            social: social,
            badges: badges,
            lastUpdated: block.timestamp
        });
        emit ScoreUpdated(wallet, total, block.timestamp);
    }

    function getScore(address wallet)
        external view returns (Score memory)
    {
        return scores[wallet];
    }

    function addRelayer(address relayer) external {
        require(msg.sender == owner, "Not owner");
        authorizedRelayers[relayer] = true;
    }
}
