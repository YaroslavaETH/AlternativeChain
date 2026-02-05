// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Bridge is Ownable {
    IERC20 public token;
    
    event BridgeLock(address indexed user, uint256 amount, uint256 timestamp);
    event BridgeUnlock(address indexed user, uint256 amount, uint256 timestamp);

    error TransferFromFalse(address from, uint256 amount, uint256 timestamp);
    error TransferToFalse(address to, uint256 amount, uint256 timestamp);
    
    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    function lock(uint256 amount) external {
        (bool result) = token.transferFrom(msg.sender, address(this), amount);
        if(!result)
            revert TransferFromFalse(msg.sender, amount, block.timestamp);
        
        emit BridgeLock(msg.sender, amount, block.timestamp);
    }

    function unlock(address user, uint256 amount) external {
        (bool result) = token.transfer(user, amount);
        if(!result)
            revert TransferToFalse(user, amount, block.timestamp);
        
        emit BridgeUnlock(user, amount, block.timestamp);
    }
}