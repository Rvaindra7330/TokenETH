const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSale", () => {
  let token, tokenSale, owner, seller, buyer;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    const TokenSale = await ethers.getContractFactory("TokenSale");
    [owner, seller, buyer] = await ethers.getSigners();

    token = await Token.deploy();
    await token.waitForDeployment();

    tokenSale = await TokenSale.deploy(token.target);
    await tokenSale.waitForDeployment();

    // Grant SELLER_ROLE to seller
    const SELLER_ROLE = await tokenSale.SELLER_ROLE();
    await tokenSale.connect(owner).grantRole(SELLER_ROLE, seller.address);

    // Transfer tokens to seller and approve TokenSale
    await token.connect(owner).transfer(seller.address, ethers.parseEther("1000"));
    await token.connect(seller).approve(tokenSale.target, ethers.parseEther("1000"));
  });

  it("deploys with correct initial state", async () => {
    expect(await tokenSale.token()).to.equal(token.target);
    expect(await tokenSale.rate()).to.equal(1000);
    const DEFAULT_ADMIN_ROLE = await tokenSale.DEFAULT_ADMIN_ROLE();
    expect(await tokenSale.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  });

  it("allows admin to set rate", async () => {
    await tokenSale.connect(owner).setRate(2000);
    expect(await tokenSale.rate()).to.equal(2000);
  });

  it("allows seller to mint tokens to contract", async () => {
    await tokenSale.connect(seller).mintToContract(ethers.parseEther("1000"));
    expect(await token.balanceOf(tokenSale.target)).to.equal(ethers.parseEther("1000"));
  });

  it("allows buying tokens with ETH", async () => {
    await tokenSale.connect(seller).mintToContract(ethers.parseEther("1000"));
    await tokenSale.connect(buyer).buyTokens({ value: ethers.parseEther("1") });
    expect(await token.balanceOf(buyer.address)).to.equal(ethers.parseEther("1000"));
  });

  it("restricts withdraw to admin", async () => {
    await tokenSale.connect(seller).mintToContract(ethers.parseEther("1000"));
    await tokenSale.connect(buyer).buyTokens({ value: ethers.parseEther("1") });
    await expect(tokenSale.connect(seller).withdraw()).to.be.reverted;
    await tokenSale.connect(owner).withdraw();
    expect(await ethers.provider.getBalance(tokenSale.target)).to.equal(0);
  });
});