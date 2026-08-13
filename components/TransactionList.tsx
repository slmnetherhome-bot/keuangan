"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { formatDate, formatIDR } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
};

const TYPE_ICON = {
  income: ArrowUpRight,
  expense: ArrowDownLeft,
  transfer: ArrowLeftRight,
} as const;

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Belum ada transaksi.
      </p>
    );
  }

  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <th className="px-4 py-3 font-medium">Tanggal</th>
            <th className="px-4 py-3 font-medium">Deskripsi</th>
            <th className="px-4 py-3 font-medium">Akun</th>
            <th className="px-4 py-3 font-medium">Tipe</th>
            <th className="px-4 py-3 text-right font-medium">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sorted.map((t) => (
            <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
              <td className="whitespace-nowrap px-4 py-3">
                {formatDate(t.date)}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{t.description}</p>
                {t.note && (
                  <p className="text-xs text-zinc-500">{t.note}</p>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {t.account}
                {t.type === "transfer" && (
                  <span className="text-zinc-500"> → {t.to_account}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                  {(() => {
                    const Icon = TYPE_ICON[t.type as keyof typeof TYPE_ICON];
                    return Icon ? <Icon className="h-3 w-3" /> : null;
                  })()}
                  {TYPE_LABEL[t.type]}
                </span>
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                  t.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : t.type === "expense"
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500"
                }`}
              >
                {t.type === "income"
                  ? `+${formatIDR(t.amount)}`
                  : t.type === "expense"
                    ? `-${formatIDR(t.amount)}`
                    : formatIDR(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}