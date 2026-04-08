"use client";

import WalletCard from "./components/WalletCard";
import TxFeed from "./components/TxFeed";
import ConversationStats from "./components/ConversationStats";
import { useTransactionFeed } from "@/hooks/useTransactionFeed";

export default function Dashboard() {
  const { transactions, totalSpent, isConnected } = useTransactionFeed();

  const txCount = transactions.length;
  const inferenceCount = transactions.filter(
    (tx) => tx.service === "inference"
  ).length;
  const catalogCount = transactions.filter(
    (tx) => tx.service === "catalog"
  ).length;

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendly</h1>
            <p className="text-sm text-gray-500">
              AI Sales Agent Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-500">
              {isConnected ? "Realtime connected" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Top Row: Wallet + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Card */}
          <div className="md:col-span-1">
            <WalletCard totalSpent={totalSpent} />
          </div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            <StatCard
              label="Total Transactions"
              value={txCount.toString()}
              sub="all time"
            />
            <StatCard
              label="AI Inferences"
              value={inferenceCount.toString()}
              sub={`$${(inferenceCount * 0.005).toFixed(3)} USDC`}
            />
            <StatCard
              label="Catalog Queries"
              value={catalogCount.toString()}
              sub={`$${(catalogCount * 0.001).toFixed(3)} USDC`}
            />
          </div>
        </div>

        {/* Two-column: Conversations + Transaction Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ConversationStats />
          <TxFeed transactions={transactions} isConnected={isConnected} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-gray-400">
        Powered by x402 micropayments on Stellar | Built for the x402 Hackathon
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
