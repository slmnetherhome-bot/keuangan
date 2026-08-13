import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint || "");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint tidak valid" },
        { status: 400 }
      );
    }

    await removeSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}