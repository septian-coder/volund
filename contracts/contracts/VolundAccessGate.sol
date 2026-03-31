// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVolundScoreOracle {
    struct Score {
        uint16 total;
        uint16 onchain;
        uint16 defi;
        uint16 identity;
        uint16 social;
        uint16 badges;
        uint256 lastUpdated;
    }
    function getScore(address wallet) external view returns (Score memory);
}

interface IVolundBadge {
    function hasClaimed(address wallet, string calldata badgeId)
        external view returns (bool);
}

contract VolundAccessGate {
    IVolundScoreOracle public scoreOracle;
    IVolundBadge public badgeContract;

    constructor(address _oracle, address _badge) {
        scoreOracle = IVolundScoreOracle(_oracle);
        badgeContract = IVolundBadge(_badge);
    }

    function isEligible(
        address wallet,
        uint16 minScore
    ) external view returns (bool eligible, string memory reason) {
        IVolundScoreOracle.Score memory score = scoreOracle.getScore(wallet);
        if (score.total < minScore) {
            return (false, "Score too low");
        }
        return (true, "");
    }

    function isEligibleWithBadge(
        address wallet,
        uint16 minScore,
        string calldata requiredBadge
    ) external view returns (bool eligible, string memory reason) {
        IVolundScoreOracle.Score memory score = scoreOracle.getScore(wallet);
        if (score.total < minScore) {
            return (false, "Score too low");
        }
        if (!badgeContract.hasClaimed(wallet, requiredBadge)) {
            return (false, "Required badge not owned");
        }
        return (true, "");
    }

    function getScore(address wallet)
        external view returns (uint16)
    {
        return scoreOracle.getScore(wallet).total;
    }
}
