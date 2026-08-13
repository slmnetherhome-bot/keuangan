import { NextResponse } from "next/server";
import { appendTransaction, readAccounts, readTransactions } from "@/lib/sheets";
import { notifyAllSubscribers } from "@/lib/push";
import type { TransactionType } from "@/lib/types";
import { randomUUID } from "crypto";
import { formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transactions = await readTransactions();
    return NextResponse.json(transactions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = String(body.date || "").trim();
    const description = String(body.description || "").trim();
    const account = String(body.account || "").trim();
    const type = String(body.type || "expense").trim();
    const amount = Number(body.amount);
    const toAccount = String(body.to_account || "").trim();
    const note = String(body.note || "").trim();

    if (!date) {
      return NextResponse.json(
        { error: "Tanggal wajib diisi" },
        { status: 400 }
      );
    }
    if (!description) {
      return NextResponse.json(
        { error: "Deskripsi wajib diisi" },
        { status: 400 }
      );
    }
    if (!account) {
      return NextResponse.json(
        { error: "Akun wajib dipilih" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah harus lebih dari 0" },
        { status: 400 }
      );
    }

    const accounts = await readAccounts();
    const accountNames = accounts.map((a) => a.name);

    if (!accountNames.includes(account)) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan" },
        { status: 400 }
      );
    }

    if (type === "transfer") {
      if (!toAccount || !accountNames.includes(toAccount)) {
        return NextResponse.json(
          { error: "Akun tujuan transfer wajib dipilih" },
          { status: 400 }
        );
      }
      if (toAccount === account) {
        return NextResponse.json(
          { error: "Akun asal dan tujuan tidak boleh sama" },
          { status: 400 }
        );
      }
    } else if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Tipe transaksi tidak valid" },
        { status: 400 }
      );
    }

    const transaction = {
      id: randomUUID(),
      date,
      description,
      account,
      type: type as TransactionType,
      amount,
      to_account: toAccount,
      note,
    };

    await appendTransaction(transaction);

    notifyAllSubscribers({
      title: "Transaksi baru dicatat",
      body: `${description} — ${formatIDR(amount)}`,
      url: "/transactions",
    }).catch(() => {});

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}