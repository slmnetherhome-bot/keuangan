"use client";

import { useEffect, useState } from "react";
import { Save, Calendar } from "lucide-react";
import type { Account, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  accounts: Account[];
  onSaved: () => void;
}

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const EMPTY = {
  date: "",
  description: "",
  account: "",
  type: "expense" as TransactionType,
  amount: "",
  to_account: "",
  note: "",
};

export default function TransactionForm({
  accounts,
  onSaved,
}: TransactionFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function initDate() {
      if (cancelled) return;
      setForm((f) => ({ ...f, date: todayISO() }));
    }
    initDate();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          description: form.description,
          account: form.account,
          type: form.type,
          amount: Number(form.amount),
          to_account: form.type === "transfer" ? form.to_account : "",
          note: form.note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan transaksi");
      }

      setForm({ ...EMPTY, date: todayISO() });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-4 font-semibold">Catat Transaksi</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Tipe</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tanggal</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            placeholder="Contoh: Belanja bulanan"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {form.type === "transfer" ? "Dari Akun" : "Akun"}
          </label>
          <select
            value={form.account}
            onChange={(e) => update("account", e.target.value)}
            required
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Pilih akun</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Jumlah (Rp)</label>
          <input
            type="number"
            min="0"
            step="any"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            required
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        {form.type === "transfer" && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Ke Akun</label>
            <select
              value={form.to_account}
              onChange={(e) => update("to_account", e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Pilih akun tujuan</option>
              {accounts
                .filter((a) => a.name !== form.account)
                .map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Catatan</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="Opsional"
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        <Save className="h-4 w-4" />
        {loading ? "Menyimpan..." : "Simpan Transaksi"}
      </button>
    </form>
  );
}