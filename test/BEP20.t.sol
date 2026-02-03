// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test, console} from "forge-std/Test.sol";
import {FirstBNBToken} from "src/BEP20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FirstBNBTokenTest is Test {
    FirstBNBToken public FBNBTT;
    address public owner;
    address public alice;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");

        FBNBTT = new FirstBNBToken(owner, 100 * 10**18);
    }

    function test_create() view public {
        assertEq(FBNBTT.name(), "FirstBNBToken", "Incorrect token name");
        assertEq(FBNBTT.symbol(), "FBNBT", "Incorrect token symbol");
        assertEq(FBNBTT.decimals(), 18, "Incorrect token decimals");
        assertEq(FBNBTT.totalSupply(), 100 * 10**18, "Incorrect total supply");
        assertEq(FBNBTT.balanceOf(owner), 100 * 10**18, "Incorrect owner balance");
    }

    function test_transfer() public {
        vm.prank(owner);
        FBNBTT.transfer(alice, 1* 10**18);
        assertEq(FBNBTT.balanceOf(alice), 1 * 10**18, "Incorrect alice balance");
        assertEq(FBNBTT.balanceOf(owner), 99 * 10**18, "Incorrect owner balance");
        assertEq(FBNBTT.totalSupply(), 100 * 10**18, "Incorrect total supply");
    }

    function test_miracle() public {
        uint256 amount = 21 * 10**18;
        
        vm.expectEmit();
        emit FirstBNBToken.Miracle(alice, amount);

        vm.prank(owner);

        FBNBTT.miracle(alice, amount);
        assertEq(FBNBTT.balanceOf(alice), amount, "Incorrect alice balance");
        assertEq(FBNBTT.balanceOf(owner), 100 * 10**18, "Incorrect owner balance");
        assertEq(FBNBTT.totalSupply(), 121 * 10**18, "Incorrect total supply"); 
    }

    function test_miracle_RevertNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        
        vm.prank(alice);

        FBNBTT.miracle(alice, 1000 * 10**18);
    }
 
}
