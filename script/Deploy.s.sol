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
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deploying MiracleERC20 ...");
        console.log("Deployer address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);
        MiracleERC20 tokenContract = new MiracleERC20(deployerAddress, 100_000_000 * 10**18);
        vm.stopBroadcast();

        console.log("MiracleERC20 deployed at:", address(tokenContract));
    }
}

// forge script script/Deploy.s.sol:DeployBridgeBSC --rpc-url bsc --broadcast --verify -vvvv
contract DeployBridgeBSC is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deploying Bridge ...");
        console.log("Deployer address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);
        Bridge bridgeContract = new Bridge(IERC20(0x47728C8FC6FcE22aB0b939F28345A84c26f0178d));
        vm.stopBroadcast();

        console.log("Bridge deployed at:", address(bridgeContract));
    }
}

// forge script script/Deploy.s.sol:DeployBridgePol --rpc-url polygon --broadcast --verify -vvvv
contract DeployBridgePol is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deploying Bridge ...");
        console.log("Deployer address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);
        Bridge bridgeContract = new Bridge(IERC20(0x768e550f12ab040bc2A5EC86Ac6335B3396F4975));
        vm.stopBroadcast();

        console.log("Bridge deployed at:", address(bridgeContract));
    }
}