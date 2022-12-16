// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import "../dependencies/openzeppelin/contracts/IERC20.sol";

interface IApeYield is IERC20 {
    event Deposit(
        address indexed caller,
        address indexed user,
        uint256 amountDeposited,
        uint256 amountShare
    );

    event Redeem(
        address indexed user,
        uint256 amountWithdraw,
        uint256 amountShare
    );

    /**
     * @dev Emitted during rescueERC20()
     * @param token The address of the token
     * @param to The address of the recipient
     * @param amount The amount being rescued
     **/
    event RescueERC20(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    function deposit(address onBehalf, uint256 amount) external;

    function withdraw(uint256 amountShare) external;
}
