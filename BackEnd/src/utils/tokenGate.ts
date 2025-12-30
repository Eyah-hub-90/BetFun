import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { tokenGateConfig } from "../config";

/**
 * Check if a wallet holds the minimum required token balance to create markets
 * @param walletAddress - The wallet address to check
 * @param connection - Solana connection instance
 * @returns Promise<boolean> - true if wallet meets requirements, false otherwise
 */
export async function checkTokenGate(
  walletAddress: string,
  connection: Connection
): Promise<{ hasAccess: boolean; balance: number; required: number }> {
  try {
    // If token gate is disabled, allow all
    if (!tokenGateConfig.enabled) {
      return { hasAccess: true, balance: 0, required: 0 };
    }

    const walletPubkey = new PublicKey(walletAddress);
    const tokenMintPubkey = new PublicKey(tokenGateConfig.tokenMintAddress);

    // Get the associated token account for this wallet
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenMintPubkey,
      walletPubkey
    );

    try {
      // Try to get the token account
      const tokenAccount = await getAccount(connection, associatedTokenAddress);

      // Convert balance from smallest unit to token amount
      const balance = Number(tokenAccount.amount) / Math.pow(10, tokenGateConfig.decimals);

      const hasAccess = balance >= tokenGateConfig.minimumBalance;

      console.log(`Token Gate Check - Wallet: ${walletAddress}, Balance: ${balance}, Required: ${tokenGateConfig.minimumBalance}, Access: ${hasAccess}`);

      return {
        hasAccess,
        balance,
        required: tokenGateConfig.minimumBalance
      };
    } catch (error) {
      // Token account doesn't exist - user has 0 balance
      console.log(`Token account not found for wallet: ${walletAddress}`);
      return {
        hasAccess: false,
        balance: 0,
        required: tokenGateConfig.minimumBalance
      };
    }
  } catch (error) {
    console.error("Error checking token gate:", error);
    // In case of error, deny access for security
    return {
      hasAccess: false,
      balance: 0,
      required: tokenGateConfig.minimumBalance
    };
  }
}
