import { NextResponse } from "next/server";
import { notifyAllSubscribers } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title || "Keuangan");
    const message = String(body?.message || "Ini adalah notifikasi tes.");

    const result = await notifyAllSubscribers({
      title,
      body: message,
      url: "/",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}