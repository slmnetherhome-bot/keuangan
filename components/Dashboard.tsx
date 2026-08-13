"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import type { Account, Transaction } from "@/lib/types";
import { formatDate, formatIDR } from "@/lib/format";
import { computeBalances } from "@/lib/balance";
import PushNotification from "@/components/PushNotification";
import { useRealtimeRefresh } from "@/components/useRealtimeRefresh";

interface DashboardData {
  accounts: Account[];
  transactions: Transaction[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
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

        const accounts = (await accountsRes.json()) as Account[];
        const transactions = (await transactionsRes.json()) as Transaction[];

        if (!cancelled) {
          setData({ accounts, transactions });
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p className="font-medium">Gagal memuat data</p>
        <p className="mt-1">{error}</p>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-white/50 p-2 text-xs dark:bg-black/30">
          {`Pastikan file .env.local sudah berisi SPREADSHEET_ID dan kredensial service account sudah disiapkan.\nLihat file README.md untuk panduan setup.`}
        </pre>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Memuat data...
      </div>
    );
  }

  const balances = computeBalances(data.accounts, data.transactions);
  const totalBalance = balances.reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const monthIncomes = data.transactions
    .filter((t) => t.type === "income" && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = data.transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);

  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-zinc-500" />
            <p className="text-sm text-zinc-500">Total Saldo</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatIDR(totalBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-5 dark:border-emerald-900 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-zinc-500">Pemasukan Bulan Ini</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatIDR(monthIncomes)}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-zinc-500">Pengeluaran Bulan Ini</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
            {formatIDR(monthExpenses)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Saldo per Akun</h2>
            <Link
              href="/accounts"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Kelola <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          {balances.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Belum ada akun.{" "}
              <Link href="/accounts" className="underline">
                Tambah akun
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {balances.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs capitalize text-zinc-500">
                      {a.type}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatIDR(a.balance)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Transaksi Terakhir</h2>
            <Link
              href="/transactions"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Lihat semua <ArrowUpRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Belum ada transaksi.{" "}
              <Link href="/transactions" className="underline">
                Catat transaksi
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(t.date)} · {t.account}
                      {t.type === "transfer" && ` → ${t.to_account}`}
                    </p>
                  </div>
                  <p
                    className={
                      t.type === "income"
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : t.type === "expense"
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : "font-semibold text-zinc-500"
                    }
                  >
                    {t.type === "income"
                      ? `+${formatIDR(t.amount)}`
                      : t.type === "expense"
                        ? `-${formatIDR(t.amount)}`
                        : formatIDR(t.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PushNotification />
    </div>
  );
}