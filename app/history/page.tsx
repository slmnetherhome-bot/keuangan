"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "@/lib/types";
import TransactionList from "@/components/TransactionList";
import { useRealtimeRefresh } from "@/components/useRealtimeRefresh";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useRealtimeRefresh(() => setReloadKey((k) => k + 1));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/transactions");

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || "Gagal memuat data");
        }

        if (!cancelled) {
          setTransactions((await res.json()) as Transaction[]);
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
      <h1 className="text-2xl font-semibold tracking-tight">Riwayat Transaksi</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <TransactionList transactions={transactions} />
    </div>
  );
}