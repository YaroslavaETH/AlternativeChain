// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/script.sol";
import {FirstBNBToken} from "src/BEP20.sol";

// forge script script/Deploy.s.sol:DeployFirstBNBToken --rpc-url bnbtest --broadcast --verify -vvvv
contract DeployFirstBNBToken is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        console.log("Deploying FirstBNBToken ...");
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast(deployerPrivateKey);
        FirstBNBToken tokenContract = new FirstBNBToken(msg.sender, 100_000_000 * 10**18);
        vm.stopBroadcast();

        console.log("FirstBNBToken factory deployed at:", address(tokenContract));
    }
}
