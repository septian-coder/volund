// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VolundRegistry {
    struct Identity {
        bool registered;
        uint256 registeredAt;
        string ensName;
        uint8 pohLevel;
        uint256 lastActivity;
    }

    mapping(address => Identity) public identities;
    mapping(address => bool) public authorizedUpdaters;
    address public owner;

    event IdentityRegistered(address indexed wallet, uint256 timestamp);
    event PohLevelUpdated(address indexed wallet, uint8 newLevel);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner,
            "Not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedUpdaters[msg.sender] = true;
    }

    function registerIdentity(string calldata ensName) external {
        require(!identities[msg.sender].registered, "Already registered");
        identities[msg.sender] = Identity({
            registered: true,
            registeredAt: block.timestamp,
            ensName: ensName,
            pohLevel: 0,
            lastActivity: block.timestamp
        });
        emit IdentityRegistered(msg.sender, block.timestamp);
    }

    function updatePohLevel(address wallet, uint8 level)
        external onlyAuthorized
    {
        require(identities[wallet].registered, "Not registered");
        require(level <= 4, "Invalid level");
        identities[wallet].pohLevel = level;
        identities[wallet].lastActivity = block.timestamp;
        emit PohLevelUpdated(wallet, level);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return identities[wallet].registered;
    }

    function getIdentity(address wallet)
        external view returns (Identity memory)
    {
        return identities[wallet];
    }

    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }
}
