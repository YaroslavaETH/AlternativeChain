// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/script.sol";
import {MiracleERC20} from "src/MiracleERC20.sol";

// forge script script/Deploy.s.sol:DeployMiracleERC20 --rpc-url bnb --broadcast --verify -vvvv
// forge script script/Deploy.s.sol:DeployMiracleERC20 --rpc-url polygon --broadcast --verify -vvvv
contract DeployMiracleERC20 is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        console.log("Deploying MiracleERC20 ...");
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast(deployerPrivateKey);
        MiracleERC20 tokenContract = new MiracleERC20(msg.sender, 100_000_000 * 10**18);
        vm.stopBroadcast();

        console.log("MiracleERC20 factory deployed at:", address(tokenContract));
    }
}
