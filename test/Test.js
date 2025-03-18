const { ethers } = require("hardhat");
const { expect } = require("chai");
describe("Token",()=>{
  let token,owner,addr1;
  beforeEach(async()=>{
    const Token = await ethers.getContractFactory("Token");
    [owner,addr1] =await ethers.getSigners();
    token = await Token.deploy();
    await token.waitForDeployment();
  });

  it("mints intial supply to owner",async()=>{
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("transfers tokens correctly",async()=>{
    await token.transfer(addr1.address,ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("checks name and symbol", async () => {
    expect(await token.name()).to.equal("Damon");
    expect(await token.symbol()).to.equal("DMN");
    expect(await token.decimals()).to.equal(18);
  });
})