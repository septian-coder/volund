// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VolundVouch {
    mapping(address => address[]) public vouchesReceived;
    mapping(address => mapping(address => bool)) public hasVouched;

    event Vouched(address indexed voucher, address indexed vouchee, uint256 timestamp);

    function vouch(address vouchee) external {
        require(vouchee != msg.sender, "Cannot vouch for yourself");
        require(!hasVouched[msg.sender][vouchee], "Already vouched for this user");

        hasVouched[msg.sender][vouchee] = true;
        vouchesReceived[vouchee].push(msg.sender);

        emit Vouched(msg.sender, vouchee, block.timestamp);
    }

    function getVouches(address wallet) external view returns (address[] memory) {
        return vouchesReceived[wallet];
    }
}
