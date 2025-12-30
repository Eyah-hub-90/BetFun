"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { url } from "@/data/data";
import { successAlert, errorAlert, warningAlert } from "@/components/elements/ToastGroup";

interface Market {
  _id: string;
  question: string;
  marketStatus: string;
  date: string;
  playerACount: number;
  playerBCount: number;
}

export default function AdminResolvePage() {
  const wallet = useWallet();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  // Fetch active markets that need resolution
  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}api/market/get`, {
        params: {
          marketStatus: "ACTIVE",
          limit: 50,
        },
      });
      setMarkets(response.data.data);
    } catch (error) {
      console.error("Error fetching markets:", error);
      errorAlert("Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  };

  const resolveMarket = async (marketId: string, outcome: boolean) => {
    if (!wallet.publicKey) {
      warningAlert("Please connect your wallet");
      return;
    }

    try {
      setResolving(marketId);

      const response = await axios.post(`${url}api/market/resolve`, {
        market_id: marketId,
        outcome: outcome,
        admin_wallet: wallet.publicKey.toBase58(),
      });

      if (response.data.success) {
        successAlert(`Market resolved! Outcome: ${response.data.outcome}`);
        // Refresh markets list
        fetchMarkets();
      }
    } catch (error: any) {
      console.error("Error resolving market:", error);
      const errorMsg = error.response?.data?.message || "Failed to resolve market";
      errorAlert(errorMsg);
    } finally {
      setResolving(null);
    }
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (!wallet.connected) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Resolution Panel</h1>
          <p className="text-[#838587] mb-8">Please connect your admin wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#111111] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Resolution Panel</h1>
          <p className="text-[#838587]">
            Connected as: {wallet.publicKey?.toBase58().slice(0, 8)}...
            {wallet.publicKey?.toBase58().slice(-8)}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchMarkets}
            disabled={loading}
            className="px-6 py-3 bg-[#07b3ff] text-[#111111] font-semibold rounded-xl hover:bg-[#0697e5] transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Markets"}
          </button>
        </div>

        {/* Markets List */}
        <div className="space-y-4">
          {loading && markets.length === 0 ? (
            <div className="text-center text-[#838587] py-12">Loading markets...</div>
          ) : markets.length === 0 ? (
            <div className="text-center text-[#838587] py-12">No active markets found</div>
          ) : (
            markets.map((market) => {
              const expired = isExpired(market.date);
              return (
                <div
                  key={market._id}
                  className={`p-6 rounded-2xl border ${
                    expired
                      ? "bg-[#1a1a1a] border-[#ff6464]/30"
                      : "bg-[#1a1a1a] border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {market.question}
                      </h3>
                      <div className="flex gap-4 text-sm text-[#838587]">
                        <span>Expires: {new Date(market.date).toLocaleString()}</span>
                        {expired && (
                          <span className="text-[#ff6464] font-semibold">EXPIRED</span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-[#838587] mt-2">
                        <span>YES Bets: ${market.playerACount?.toFixed(2) || 0}</span>
                        <span>NO Bets: ${market.playerBCount?.toFixed(2) || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Buttons */}
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => resolveMarket(market._id, true)}
                      disabled={resolving === market._id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#07b3ff] to-[#0595d3] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resolving === market._id ? "Resolving..." : "Resolve as YES"}
                    </button>
                    <button
                      onClick={() => resolveMarket(market._id, false)}
                      disabled={resolving === market._id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ff6464] to-[#ff4444] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resolving === market._id ? "Resolving..." : "Resolve as NO"}
                    </button>
                  </div>

                  {expired && (
                    <div className="mt-3 text-center text-sm text-[#ff6464]">
                      ⚠ This market has expired and should be resolved
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
