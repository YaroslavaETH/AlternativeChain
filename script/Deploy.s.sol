// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/script.sol";
import {MiracleERC20} from "src/MiracleERC20.sol";
import {Bridge} from "src/Bridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// forge script script/Deploy.s.sol:DeployMiracleERC20 --rpc-url bsc --broadcast --verify -vvvv
// forge script script/Deploy.s.sol:DeployMiracleERC20 --rpc-url polygon --broadcast --verify -vvvv
contract DeployMiracleERC20 is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        console.log("Deploying MiracleERC20 ...");
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast(deployerPrivateKey);
        MiracleERC20 tokenContract = new MiracleERC20(msg.sender, 100_000_000 * 10**18);
        vm.stopBroadcast();

        console.log("MiracleERC20 deployed at:", address(tokenContract));
    }
}

// forge script script/Deploy.s.sol:DeployBridgeBSC --rpc-url bsc --broadcast --verify -vvvv
contract DeployBridgeBSC is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        console.log("Deploying Bridge ...");
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast(deployerPrivateKey);
        Bridge bridgeContract = new Bridge(IERC20(0xa2a00beCACd814DfaE89545c7109998F7fd87FB4));
        vm.stopBroadcast();

        console.log("Bridge deployed at:", address(bridgeContract));
    }
}

// forge script script/Deploy.s.sol:DeployBridgePol --rpc-url polygon --broadcast --verify -vvvv
contract DeployBridgePol is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        console.log("Deploying Bridge ...");
        console.log("Deployer address:", msg.sender);

        vm.startBroadcast(deployerPrivateKey);
        Bridge bridgeContract = new Bridge(IERC20(0x48d6336828Cf62e5765885192e588cbCA7465532));
        vm.stopBroadcast();

        console.log("Bridge deployed at:", address(bridgeContract));
    }
}