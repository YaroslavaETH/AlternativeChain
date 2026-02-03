// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FirstBNBToken is ERC20, Ownable {
    
    event Miracle(address indexed to, uint256 indexed amount);
    
    constructor(address initialOwner, uint256 startCoins)
        ERC20("FirstBNBToken", "FBNBT")        
        Ownable(initialOwner) {
            _mint(initialOwner, startCoins);
            emit Miracle(initialOwner, startCoins);
        }


    function miracle(address to, uint256 amount) onlyOwner public {
        _mint(to, amount);
        emit Miracle(to, amount); 
    }
}