"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Account, AccountType, Transaction } from "@/lib/types";
import { formatIDR } from "@/lib/format";
import { computeBalances } from "@/lib/balance";
import { useRealtimeRefresh } from "@/components/useRealtimeRefresh";

const TYPE_LABEL: Record<AccountType, string> = {
  cash: "Kas",
  bank: "Bank",
  ewallet: "E-Wallet",
  other: "Lainnya",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [openingBalance, setOpeningBalance] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          opening_balance: Number(openingBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambah akun");
      }

      setName("");
      setType("cash");
      setOpeningBalance("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const balances = computeBalances(accounts, transactions);
  const total = balances.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-4 font-semibold">Tambah Akun</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nama Akun
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Kas, Bank BCA"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipe</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Saldo Awal (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Plus className="h-4 w-4" />
          {loading ? "Menyimpan..." : "Tambah Akun"}
        </button>
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daftar Akun</h2>
          <p className="text-sm text-zinc-500">
            Total:{" "}
            <span className="font-semibold tabular-nums">
              {formatIDR(total)}
            </span>
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 text-right font-medium">
                  Saldo Awal
                </th>
                <th className="px-4 py-3 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {balances.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize dark:bg-zinc-800">
                      {TYPE_LABEL[a.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIDR(a.opening_balance)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatIDR(a.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}