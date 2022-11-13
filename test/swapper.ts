import { ethers} from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Swapper__factory, Swapper } from "../typechain";

chai.use(chaiAsPromised);
const { expect } = chai;
const hre = require("hardhat");

const ercABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

const uniswapRouter = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const matic = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'

describe("Swapper", () => {
  let swapper: Swapper;

  beforeEach(async () => {
    
    const signers = await ethers.getSigners(); 
    const swapperFactory = (await ethers.getContractFactory(
      "Swapper",
      signers[0]
    )) as Swapper__factory;
    swapper = await swapperFactory.deploy(uniswapRouter, weth);
    await swapper.deployed();
  });

  
  describe("Swap", async () => {
    it("should swap correctly", async () => {
      expect(swapper).to.not.eq(undefined);

      const accountToImpersonate = "0x46f80018211D5cBBc988e853A8683501FCA4ee9b";

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [accountToImpersonate]
      })

      const signer = await ethers.getSigner(accountToImpersonate);

      const usdtContract = new ethers.Contract(usdt, ercABI, signer);

      const maticContract = new ethers.Contract(matic, ercABI, signer);

      let usdtBalance = await usdtContract.balanceOf(accountToImpersonate);
      let maticBalance = await maticContract.balanceOf(accountToImpersonate);

      console.log('USDT Balance before: ', ethers.utils.formatUnits(usdtBalance,6));
      console.log('Matic Balance before: ', ethers.utils.formatUnits(maticBalance,18));

      let amountToSwap = ethers.utils.parseUnits('1000', 6);
      

      const txApprove = await usdtContract.approve(swapper.address, ethers.utils.parseUnits('1100', 6));
      await txApprove.wait();

      let swapTx = await swapper.connect(signer).swap(usdt,matic, amountToSwap, ethers.utils.parseUnits('500', 6), accountToImpersonate  );
      await swapTx.wait();

      usdtBalance = await usdtContract.balanceOf(accountToImpersonate);
      maticBalance = await maticContract.balanceOf(accountToImpersonate);

      console.log('USDT Balance after: ', ethers.utils.formatUnits(usdtBalance,6));
      console.log('Matic Balance after: ', ethers.utils.formatUnits(maticBalance,18));



    });
  });

});
