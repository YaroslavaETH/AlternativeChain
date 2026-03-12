// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MiracleERC20} from "src/MiracleERC20.sol";
import {Bridge} from "src/Bridge.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeTest is Test {
    MiracleERC20 public mrcl;
    Bridge public bridge;
    address public owner;
    address public alice;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");

        mrcl = new MiracleERC20(owner, 100 * 10**18);
        bridge = new Bridge(mrcl);
    }

    function test_create() view public {
        assertEq(address(bridge.token()), address(mrcl), "Incorrect token address");
    }

    function test_lock() public {
        uint256 amount = 1* 10**18;
        vm.prank(owner);
        mrcl.miracle(alice, amount);
        vm.startPrank(alice);
        mrcl.approve(address(bridge), amount);
        vm.expectEmit();
        emit Bridge.BridgeLock(alice, amount, block.timestamp);
        bridge.lock(amount);
        vm.stopPrank();
    }

    function test_unlock_RevertNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        bridge.unlock(alice, 1* 10**18);
    }

    function test_unlock() public {
        uint256 amount = 1* 10**18;
        vm.prank(owner);
        mrcl.miracle(address(bridge), amount);
        vm.expectEmit();
        emit Bridge.BridgeUnlock(alice, amount, block.timestamp);
        bridge.unlock(alice, amount);
    }
 
}
