// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test, console} from "forge-std/Test.sol";
import {MiracleERC20} from "src/MiracleERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MiracleERC20Test is Test {
    MiracleERC20 public MRCL;
    address public owner;
    address public alice;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");

        MRCL = new MiracleERC20(owner, 100 * 10**18);
    }

    function test_create() view public {
        assertEq(MRCL.name(), "MiracleERC20", "Incorrect token name");
        assertEq(MRCL.symbol(), "MRCL", "Incorrect token symbol");
        assertEq(MRCL.decimals(), 18, "Incorrect token decimals");
        assertEq(MRCL.totalSupply(), 100 * 10**18, "Incorrect total supply");
        assertEq(MRCL.balanceOf(owner), 100 * 10**18, "Incorrect owner balance");
    }

    function test_transfer() public {
        vm.prank(owner);
        MRCL.transfer(alice, 1* 10**18);
        assertEq(MRCL.balanceOf(alice), 1 * 10**18, "Incorrect alice balance");
        assertEq(MRCL.balanceOf(owner), 99 * 10**18, "Incorrect owner balance");
        assertEq(MRCL.totalSupply(), 100 * 10**18, "Incorrect total supply");
    }

    function test_miracle() public {
        uint256 amount = 21 * 10**18;
        
        vm.expectEmit();
        emit MiracleERC20.Miracle(alice, amount);

        vm.prank(owner);

        MRCL.miracle(alice, amount);
        assertEq(MRCL.balanceOf(alice), amount, "Incorrect alice balance");
        assertEq(MRCL.balanceOf(owner), 100 * 10**18, "Incorrect owner balance");
        assertEq(MRCL.totalSupply(), 121 * 10**18, "Incorrect total supply"); 
    }

    function test_miracle_RevertNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        
        vm.prank(alice);

        MRCL.miracle(alice, 1000 * 10**18);
    }
 
}
