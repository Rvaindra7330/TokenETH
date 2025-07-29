const { expect } = require('chai');
const { ethers, network } = require('hardhat');

describe("Staking: Mainnet forking test:", function () {
    let staking, user, usdc, weth;
    const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    beforeEach(async () => {
        //impersonate a whale account for testing
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0A59649758aa4d66E25f08Dd01271e891fe52199"] //usdc whale
        })
        whale = await ethers.getImpersonatedSigner("0x0A59649758aa4d66E25f08Dd01271e891fe52199");
        [user] = await ethers.getSigners();
        usdc = await ethers.getContractAt("IERC20", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
        const IWETH_ABI = [
            "function deposit() payable",
            "function withdraw(uint wad)",
            "function approve(address guy, uint wad) returns (bool)",
            "function balanceOf(address) view returns (uint)",
            "function transfer(address dst, uint wad) returns (bool)"
        ];

        weth = await ethers.getContractAt(IWETH_ABI, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
        await network.provider.send("hardhat_setBalance", [
            whale.address,
            "0x1000000000000000000" // 1 ETH in hex
        ]);
        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(usdc.target);

    })
    it("should stake USDC after swap", async () => {
        await usdc.connect(whale).transfer(user.address, 100000000);

        await usdc.connect(user).approve(staking.target, 100000000);
        await staking.connect(user).stake(100000000);
        const staked = await staking.stakes(user.address)
        expect(staked.amount).to.equal(100000000)
    })

    it("User can stake USDC after swapping with WETH", async () => {
        const IUniswapV2Router02_ABI = [
            "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
        ];

        const router = await ethers.getContractAt(
            IUniswapV2Router02_ABI,
            UNISWAP_ROUTER,
            user
        );
        await weth.connect(user).deposit({ value: ethers.parseEther("1") })
        console.log("swapping..")
        await weth.connect(user).approve(router.target, ethers.parseEther("1"));
        await router.connect(user).swapExactTokensForTokens(
            ethers.parseEther("1"),
            0,
            [weth.target, usdc.target],
            user.address,
            Math.floor(Date.now() / 1000) + 60
        );
        console.log("staking..")
        const usdc_balance = await usdc.balanceOf(user.address);
        await usdc.connect(user).approve(staking.target, usdc_balance);
        await staking.connect(user).stake(usdc_balance);

        const staked = await staking.stakes(user.address);
        expect(staked.amount).to.deep.equal(usdc_balance);
    })

})