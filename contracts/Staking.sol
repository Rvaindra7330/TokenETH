// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Staking is AccessControl, ReentrancyGuard,Pausable {
    bytes32 public constant REWARD_FUNDER_ROLE = keccak256("REWARD_FUNDER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    IERC20 public token; // MTK token
    uint256 public constant REWARD_RATE = 1e17; // 0.1 (10% APY, unitless)

    struct Stake {
        uint256 amount;
        uint256 lastUpdate;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ContractPaused(address account);
    event contractUnpaused(address account);
    error InsufficientBalance(uint256 available, uint256 required);
    constructor(address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_FUNDER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        token = IERC20(_token);
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Must stake positive amount");
        updateRewards(msg.sender);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lastUpdate = block.timestamp;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Must withdraw positive amount");
        if(amount > stakes[msg.sender].amount){
            revert InsufficientBalance(stakes[msg.sender].amount, amount);
        }
        updateRewards(msg.sender);
        stakes[msg.sender].amount -= amount;
        stakes[msg.sender].lastUpdate = block.timestamp;
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant whenNotPaused {
        updateRewards(msg.sender);
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        rewards[msg.sender] = 0;
        require(token.transfer(msg.sender, reward), "Transfer failed");
        emit RewardsClaimed(msg.sender, reward);
    }

    function updateRewards(address user) internal {
        uint256 timeElapsed = block.timestamp - stakes[user].lastUpdate;
        if (stakes[user].amount > 0) {
            rewards[user] += (stakes[user].amount * REWARD_RATE * timeElapsed) / (365 days * 1e18);
        }
        stakes[user].lastUpdate = block.timestamp;
    }

    function fundRewards(uint256 amount) external onlyRole(REWARD_FUNDER_ROLE) {
        require(amount > 0, "Must fund positive amount");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function getPendingRewards(address user) external view returns (uint256) {
        uint256 timeElapsed = block.timestamp - stakes[user].lastUpdate;
        return rewards[user] + (stakes[user].amount * REWARD_RATE * timeElapsed) / (365 days * 1e18);
    }
    //adding pausable
    function pause() external onlyRole(PAUSER_ROLE){
        _pause();
        emit Paused(msg.sender);
    }
    function unpause() external onlyRole(PAUSER_ROLE){
        _unpause();
        emit Unpaused(msg.sender);
    }
}