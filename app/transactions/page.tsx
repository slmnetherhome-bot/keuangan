"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import type { Account, Transaction } from "@/lib/types";
import TransactionForm from "@/components/TransactionForm";
import { useRealtimeRefresh } from "@/components/useRealtimeRefresh";

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useRealtimeRefresh(() => setReloadKey((k) => k + 1));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accountsRes, transactionsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/transactions"),
        ]);

        if (!accountsRes.ok || !transactionsRes.ok) {
          const errBody = await accountsRes.json().catch(() => null);
          throw new Error(errBody?.error || "Gagal memuat data");
        }

        if (!cancelled) {
          setAccounts((await accountsRes.json()) as Account[]);
          setTransactions((await transactionsRes.json()) as Transaction[]);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Catat Transaksi</h1>
        <Link
          href="/history"
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <History className="h-4 w-4" />
          Riwayat
        </Link>
      </div>

      <TransactionForm
        accounts={accounts}
        onSaved={() => setReloadKey((k) => k + 1)}
      />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {transactions.length > 0 && (
        <p className="text-sm text-zinc-500">
          Sudah tercatat {transactions.length} transaksi.{" "}
          <Link href="/history" className="font-medium underline">
            Lihat riwayat lengkap →
          </Link>
        </p>
      )}
    </div>
  );
}