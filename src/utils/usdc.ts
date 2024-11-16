import { ethers } from "ethers";

export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC

// USDC Contract ABI - Only including transfer function for simplicity
const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
];

export class USDCTransfer {
  private provider: ethers.BrowserProvider;
  private contract: ethers.Contract;

  constructor() {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.contract = new ethers.Contract(
      USDC_ADDRESS,
      USDC_ABI,
      this.provider
    ) as ethers.Contract & {
      transfer(
        to: string,
        amount: ethers.BigNumberish
      ): Promise<ethers.ContractTransactionResponse>;
      balanceOf(account: string): Promise<ethers.BigNumberish>;
      decimals(): Promise<number>;
    };
  }

  async transfer(toAddress: string, amount: number) {
    try {
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      // Get signer
      const signer = await this.provider.getSigner();

      // Connect contract to signer
      const contractWithSigner = this.contract.connect(
        signer
      ) as ethers.Contract & {
        transfer(
          to: string,
          amount: ethers.BigNumberish
        ): Promise<ethers.ContractTransactionResponse>;
        balanceOf(account: string): Promise<ethers.BigNumberish>;
        decimals(): Promise<number>;
      };

      // Get USDC decimals
      const decimals = await this.contract.decimals();

      // Convert amount to proper decimal places
      const amountInSmallestUnit = ethers.parseUnits(
        amount.toString(),
        decimals
      );

      // Send transaction
      const tx = await contractWithSigner.transfer(
        toAddress,
        amountInSmallestUnit
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction failed - no receipt received");
      }

      return {
        success: true,
        hash: receipt.hash,
        receipt,
      };
    } catch (error) {
      console.error("USDC transfer error:", error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      const decimals = await this.contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      throw error;
    }
  }
}
