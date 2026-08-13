"use client";

import { useEffect, useState } from "react";
import type { Account, Transaction } from "@/lib/types";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
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
      <TransactionForm
        accounts={accounts}
        onSaved={() => setReloadKey((k) => k + 1)}
      />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-3 font-semibold">
          Daftar Transaksi ({transactions.length})
        </h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}