"use client";

import { Transaction } from "@/hooks/useTransactionFeed";

interface TxFeedProps {
  transactions: Transaction[];
  isConnected: boolean;
}

function serviceLabel(service: string): string {
  switch (service) {
    case "inference":
      return "AI Inference";
    case "catalog":
      return "Catalog Query";
    default:
      return service;
  }
}

function serviceColor(service: string): string {
  switch (service) {
    case "inference":
      return "bg-amber-100 text-amber-800";
    case "catalog":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function TxFeed({ transactions, isConnected }: TxFeedProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          x402 Transactions
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">
            No transactions yet. Send a message to the Telegram bot to generate
            x402 payments.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${serviceColor(
                      tx.service
                    )}`}
                  >
                    {serviceLabel(tx.service)}
                  </span>
                  <span className="text-sm text-gray-600 font-mono">
                    {tx.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900">
                    -${Number(tx.amount_usdc).toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {timeAgo(tx.created_at)}
                  </span>
                </div>
              </div>
              {tx.stellar_tx_hash && !tx.stellar_tx_hash.startsWith("x402-") && !tx.stellar_tx_hash.startsWith("failed-") && tx.stellar_tx_hash !== "pending" && (
                <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                  TX: {tx.stellar_tx_hash}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
