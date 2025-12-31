"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import axios from "axios";
import { url } from "@/data/data";
import { successAlert, errorAlert, warningAlert, infoAlert } from "@/components/elements/ToastGroup";

interface ResolvedMarket {
  _id: string;
  question: string;
  marketStatus: string;
  date: string;
  market: string; // on-chain market address
  tokenA: string; // YES token mint
  tokenB: string; // NO token mint
}

export default function ClaimPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [markets, setMarkets] = useState<ResolvedMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      fetchResolvedMarkets();
    }
  }, [wallet.publicKey]);

  const fetchResolvedMarkets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}api/market/get`, {
        params: {
          marketStatus: "RESOLVED",
          limit: 50,
        },
      });
      setMarkets(response.data.data);
    } catch (error) {
      console.error("Error fetching markets:", error);
      errorAlert("Failed to fetch resolved markets");
    } finally {
      setLoading(false);
    }
  };

  const claimWinnings = async (market: ResolvedMarket) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      warningAlert("Please connect your wallet");
      return;
    }

    try {
      setClaiming(market._id);
      infoAlert("Preparing claim transaction...");

      // Get market info to determine winning token
      const marketInfo = await axios.get(`${url}api/market/winning-info`, {
        params: {
          market_id: market._id,
          user_wallet: wallet.publicKey.toBase58(),
        },
      });

      // For this example, we'll try with both tokens
      // In production, you'd know which token won from the market result
      const tokenA = new PublicKey(market.tokenA);
      const tokenB = new PublicKey(market.tokenB);

      // Get user's token accounts
      const userTokenAccountA = await getAssociatedTokenAddress(
        tokenA,
        wallet.publicKey
      );

      const userTokenAccountB = await getAssociatedTokenAddress(
        tokenB,
        wallet.publicKey
      );

      // Check both token balances to determine which token user holds
      let winningTokenMint: PublicKey | null = null;
      let userTokenAccount: PublicKey | null = null;
      let userBalance = 0;

      try {
        const tokenAccountAInfo = await connection.getAccountInfo(userTokenAccountA);
        if (tokenAccountAInfo) {
          const accountData = await connection.getTokenAccountBalance(userTokenAccountA);
          if (accountData.value.uiAmount && accountData.value.uiAmount > 0) {
            winningTokenMint = tokenA;
            userTokenAccount = userTokenAccountA;
            userBalance = accountData.value.uiAmount;
          }
        }
      } catch (error) {
        console.log("No token A account or balance");
      }

      // If no token A balance, try token B
      if (!winningTokenMint) {
        try {
          const tokenAccountBInfo = await connection.getAccountInfo(userTokenAccountB);
          if (tokenAccountBInfo) {
            const accountData = await connection.getTokenAccountBalance(userTokenAccountB);
            if (accountData.value.uiAmount && accountData.value.uiAmount > 0) {
              winningTokenMint = tokenB;
              userTokenAccount = userTokenAccountB;
              userBalance = accountData.value.uiAmount;
            }
          }
        } catch (error) {
          console.log("No token B account or balance");
        }
      }

      if (!winningTokenMint || !userTokenAccount || userBalance === 0) {
        warningAlert("You don't have any tokens from this market");
        setClaiming(null);
        return;
      }

      console.log("User has", userBalance, "tokens to claim with");
      infoAlert(`Found ${userBalance} tokens. Withdrawal ready after smart contract deployment!`);

      // Once smart contract is deployed, this will create actual withdrawal transaction
      successAlert(`Ready to claim with ${userBalance} tokens! Deploy smart contract to enable.`);
    } catch (error: any) {
      console.error("Error claiming winnings:", error);
      const errorMsg = error.response?.data?.message || "Failed to claim winnings";
      errorAlert(errorMsg);
    } finally {
      setClaiming(null);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Claim Your Winnings</h1>
          <p className="text-[#838587] mb-8">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#111111] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Claim Your Winnings</h1>
          <p className="text-[#838587]">
            View resolved markets and claim your payouts
          </p>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchResolvedMarkets}
            disabled={loading}
            className="px-6 py-3 bg-[#07b3ff] text-[#111111] font-semibold rounded-xl hover:bg-[#0697e5] transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Markets"}
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-[#07b3ff]/10 to-[#0595d3]/10 border border-[#07b3ff]/30 rounded-2xl">
          <div className="text-[#07b3ff] font-semibold mb-2">How Claiming Works</div>
          <div className="text-[#838587] text-sm">
            1. Markets must be resolved by admin<br />
            2. If you bet on the winning side, you can claim your share<br />
            3. Your payout is proportional to your winning tokens vs total winning tokens<br />
            4. Click "Claim Winnings" to receive your SOL
          </div>
        </div>

        {/* Markets List */}
        <div className="space-y-4">
          {loading && markets.length === 0 ? (
            <div className="text-center text-[#838587] py-12">Loading markets...</div>
          ) : markets.length === 0 ? (
            <div className="text-center text-[#838587] py-12">
              No resolved markets found. Check back after markets are resolved!
            </div>
          ) : (
            markets.map((market) => (
              <div
                key={market._id}
                className="p-6 rounded-2xl border bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f] border-[#07b3ff]/30"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {market.question}
                    </h3>
                    <div className="flex gap-4 text-sm text-[#838587]">
                      <span className="text-[#07b3ff] font-semibold">✓ RESOLVED</span>
                      <span>Resolved: {new Date(market.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => claimWinnings(market)}
                    disabled={claiming === market._id}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#07b3ff] to-[#0595d3] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claiming === market._id ? "Processing..." : "💰 Claim Winnings"}
                  </button>
                </div>

                <div className="mt-3 text-center text-xs text-[#838587]">
                  You must have winning tokens in your wallet to claim
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
