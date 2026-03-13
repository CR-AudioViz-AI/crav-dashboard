// app/dashboard/credits/page.tsx
// CR AudioViz AI Credits Management - REAL Supabase Data
// Timestamp: 2025-11-28 15:10 UTC

import { createServiceClient } from "@/lib/supabase/server";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CreditCard,
  Zap,
  Clock,
  RefreshCw,
} from "lucide-react";

async function getCreditsData() {
  const supabase = createServiceClient();

  // Get all user credits
  const { data: userCredits, error: creditsError } = await supabase
    .from("user_credits")
    .select("*")
    .order("updated_at", { ascending: false });

  // Get credit transactions
  const { data: transactions, error: transError } = await supabase
    .from("credit_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Calculate totals
  const totalBalance = userCredits?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
  const totalEarned = userCredits?.reduce((sum, u) => sum + (u.total_earned || 0), 0) || 0;
  const totalSpent = userCredits?.reduce((sum, u) => sum + (u.total_spent || 0), 0) || 0;

  // Get this month's activity
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= startOfMonth
  ) || [];

  const monthlyEarned = monthlyTransactions
    .filter((t) => t.type === "purchase" || t.type === "bonus" || t.type === "refund")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlySpent = monthlyTransactions
    .filter((t) => t.type === "spend" || t.type === "usage")
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  return {
    totalBalance,
    totalEarned,
    totalSpent,
    monthlyEarned,
    monthlySpent,
    transactions: transactions || [],
    userCount: userCredits?.length || 0,
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionRow({
  transaction,
}: {
  transaction: {
    id: string;
    type: string;
    amount: number;
    description?: string;
    created_at: string;
    user_id: string;
  };
}) {
  const isPositive = transaction.amount > 0;
  const typeColors: Record<string, string> = {
    purchase: "bg-green-100 text-green-800",
    bonus: "bg-blue-100 text-blue-800",
    spend: "bg-red-100 text-red-800",
    usage: "bg-orange-100 text-orange-800",
    refund: "bg-purple-100 text-purple-800",
    default: "bg-gray-100 text-gray-800",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(transaction.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            typeColors[transaction.type] || typeColors.default
          }`}
        >
          {transaction.type?.toUpperCase() || "UNKNOWN"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {transaction.description || "No description"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
        <span
          className={`font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {transaction.amount.toLocaleString()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
        {transaction.user_id?.slice(0, 8)}...
      </td>
    </tr>
  );
}

export default async function CreditsPage() {
  const {
    totalBalance,
    totalEarned,
    totalSpent,
    monthlyEarned,
    monthlySpent,
    transactions,
    userCount,
  } = await getCreditsData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-8 w-8 text-blue-600" />
          Credits Management
        </h1>
        <p className="mt-2 text-gray-600">
          Platform-wide credit balances and transaction history • {userCount} users with credits
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {totalBalance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">credits across all users</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">All-Time Earned</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalEarned.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">total credits issued</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">All-Time Spent</h3>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {totalSpent.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">total credits consumed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">This Month</h3>
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-600">
              +{monthlyEarned.toLocaleString()}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-lg font-bold text-red-600">
              -{monthlySpent.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">earned / spent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <CreditCard className="h-5 w-5" />
          Add Credits
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Zap className="h-5 w-5" />
          Bulk Grant
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500 mt-1">
              {transactions.length} recent transactions from Supabase
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500">
              Credit transactions will appear here as users earn and spend credits.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About the Credit System
        </h3>
        <p className="text-blue-800 text-sm">
          Credits are the universal currency across all CR AudioViz AI applications.
          Users can purchase credits, earn them through referrals, and spend them on
          premium features. Credits never expire on paid plans.
        </p>
      </div>
    </div>
  );
}
