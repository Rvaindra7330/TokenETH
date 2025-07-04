const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", () => {
  let token, staking, owner, user, funder;
  const REWARD_RATE = ethers.parseEther("0.1"); // 0.1 MTK per token per year

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    const Staking = await ethers.getContractFactory("Staking");
    [owner, user, funder] = await ethers.getSigners();

    token = await Token.deploy();
    await token.waitForDeployment();

    staking = await Staking.deploy(token.target);
    await staking.waitForDeployment();

    // Grant REWARD_FUNDER_ROLE
    const REWARD_FUNDER_ROLE = await staking.REWARD_FUNDER_ROLE();
    await staking.connect(owner).grantRole(REWARD_FUNDER_ROLE, funder.address);

    // Fund user and funder with MTK
    await token.connect(owner).transfer(user.address, ethers.parseEther("1000"));
    await token.connect(owner).transfer(funder.address, ethers.parseEther("1000"));

    // Approve Staking contract
    await token.connect(user).approve(staking.target, ethers.parseEther("1000"));
    await token.connect(funder).approve(staking.target, ethers.parseEther("1000"));
  });

  it("deploys with correct initial state", async () => {
    expect(await staking.token()).to.equal(token.target);
    const DEFAULT_ADMIN_ROLE = await staking.DEFAULT_ADMIN_ROLE();
    expect(await staking.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  });

  it("allows user to stake MTK", async () => {
    await staking.connect(user).stake(ethers.parseEther("100"));
    const stake = await staking.stakes(user.address);
    expect(stake.amount).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(staking.target)).to.equal(ethers.parseEther("100"));
  });

  it("allows user to withdraw staked MTK", async () => {
    await staking.connect(user).stake(ethers.parseEther("100"));
    await staking.connect(user).withdraw(ethers.parseEther("50"));
    const stake = await staking.stakes(user.address);
    expect(stake.amount).to.equal(ethers.parseEther("50"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("950"));
  });

  it("calculates and claims rewards", async () => {
    await staking.connect(funder).fundRewards(ethers.parseEther("1000"));
    await staking.connect(user).stake(ethers.parseEther("100"));

    // Fast-forward 1 year
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const pendingRewards = await staking.getPendingRewards(user.address);
    expect(pendingRewards).to.be.closeTo(ethers.parseEther("10"), ethers.parseEther("0.1")); // 100 * 0.1 = 10 MTK

    await staking.connect(user).claimRewards();
    expect(await token.balanceOf(user.address)).to.be.closeTo(ethers.parseEther("910"), ethers.parseEther("0.1"));
    expect(await staking.rewards(user.address)).to.equal(0);
  });

  it("restricts fundRewards to REWARD_FUNDER_ROLE", async () => {
    await expect(staking.connect(user).fundRewards(ethers.parseEther("100"))).to.be.reverted;
    await staking.connect(funder).fundRewards(ethers.parseEther("100"));
    expect(await token.balanceOf(staking.target)).to.equal(ethers.parseEther("100"));
  });

  it("prevents reentrancy on withdraw", async () => {
    await staking.connect(user).stake(ethers.parseEther("100"));
    await staking.connect(user).withdraw(ethers.parseEther("50"));
    const stake = await staking.stakes(user.address);
    expect(stake.amount).to.equal(ethers.parseEther("50"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("950"));
  });
  it("allows PAUSER-ROLE to pause and unpause",async()=>{
    await staking.connect(owner).pause();
    expect(await staking.paused()).to.be.true;
    await staking.connect(owner).unpause();
    expect ( await staking.paused()).to.be.false;
  });
  it("blocks staking when paused",async()=>{
    await staking.connect(owner).pause();
    await expect(staking.connect(user).stake(ethers.parseEther("100"))).to.be.revertedWithCustomError(staking, "EnforcedPause")
  });
  it("blocks withdrawing when paused",async()=>{
    await staking.connect(user).stake(ethers.parseEther("100"))
    await staking.connect(owner).pause();
    await expect(staking.connect(user).withdraw(ethers.parseEther("100"))).to.be.revertedWithCustomError(staking, "EnforcedPause");
  });
  it("blocks claiming rewards when paused",async()=>{
    await staking.connect(funder).fundRewards(ethers.parseEther("1000"));
    await staking.connect(user).stake(ethers.parseEther("100"));
    await staking.connect(owner).pause();
    await expect(staking.connect(user).claimRewards()).to.be.revertedWithCustomError(staking, "EnforcedPause");
  });
  it("restricts pause and unpause to PAUSER_ROLE",async()=>{
   await expect(staking.connect(user).pause()).to.be.reverted;
   await expect(staking.connect(user).unpause()).to.be.reverted;
  })
});