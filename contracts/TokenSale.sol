// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSale is AccessControl {
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    IERC20 public token;
    uint256 public rate = 1000; // 1 ETH = 1000 MTK
    uint256 public constant MAX_SUPPLY = 10000 * 10 ** 18;
    uint256 public totalSold;

    event TokensPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount
    );
    event RateUpdated(uint256 newRate);

    constructor(address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SELLER_ROLE, msg.sender);
        token = IERC20(_token);
    }

    function setRate(uint256 _rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_rate > 0, "Rate must be positive");
        rate = _rate;
        emit RateUpdated(_rate);
    }

    function mintToContract(uint256 amount) external onlyRole(SELLER_ROLE) {
        require(totalSold + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }

    function buyTokens() external payable {
        require(msg.value > 0, "Must send ETH");
        uint256 tokenAmount = msg.value * rate;
        require(totalSold + tokenAmount <= MAX_SUPPLY, "Exceeds max supply");
        require(
            token.balanceOf(address(this)) >= tokenAmount,
            "Insufficient tokens"
        );
        totalSold += tokenAmount;
        require(token.transfer(msg.sender, tokenAmount), "Transfer failed");
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "ETH transfer failed");
    }

    function addSeller(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SELLER_ROLE, account);
    }

    function removeSeller(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SELLER_ROLE, account);
    }
}
