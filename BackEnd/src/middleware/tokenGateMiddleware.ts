import { Request, Response, NextFunction } from "express";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { checkTokenGate } from "../utils/tokenGate";

// Initialize Solana connection
const SOLANA_RPC = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const connection = new Connection(SOLANA_RPC, "confirmed");

/**
 * Middleware to check if a user has the required token balance to create markets
 */
export async function tokenGateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { creator } = req.body.data;

    if (!creator) {
      res.status(400).json({
        error: "Creator wallet address is required",
        message: "Please connect your wallet to create a market"
      });
      return;
    }

    // Check if the wallet has the required token balance
    const gateCheck = await checkTokenGate(creator, connection);

    if (!gateCheck.hasAccess) {
      res.status(403).json({
        error: "Insufficient token balance",
        message: `You need at least ${gateCheck.required.toLocaleString()} tokens to create markets. Your current balance: ${gateCheck.balance.toLocaleString()} tokens`,
        required: gateCheck.required,
        balance: gateCheck.balance
      });
      return;
    }

    // User has access, proceed to next middleware
    console.log(`Token gate passed for wallet: ${creator}`);
    next();
  } catch (error) {
    console.error("Token gate middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify token balance. Please try again later."
    });
    return;
  }
}
