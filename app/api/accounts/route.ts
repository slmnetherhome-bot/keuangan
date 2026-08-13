import { NextResponse } from "next/server";
import { appendAccount, readAccounts } from "@/lib/sheets";
import type { AccountType } from "@/lib/types";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await readAccounts();
    return NextResponse.json(accounts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const type = String(body.type || "cash").trim();
    const openingBalance = Number(body.opening_balance) || 0;

    if (!name) {
      return NextResponse.json(
        { error: "Nama akun wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await readAccounts();
    if (existing.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json(
        { error: "Akun dengan nama tersebut sudah ada" },
        { status: 409 }
      );
    }

    const account = {
      id: randomUUID(),
      name,
      type: type as AccountType,
      opening_balance: openingBalance,
    };

    await appendAccount(account);
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}