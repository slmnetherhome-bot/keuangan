import webpush from "web-push";
import {
  appendSubscription,
  clearSubscriptions,
  readSubscriptions,
} from "@/lib/sheets";

let initialized = false;

function init() {
  if (initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@keuangan.local";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys belum diatur. Jalankan `npx web-push generate-vapid-keys` dan isi di .env.local"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

export interface StoredSubscription {
  endpoint: string;
  subscription: string;
}

export async function saveSubscription(
  pushSubscription: PushSubscriptionJSON
): Promise<void> {
  init();
  const existing = await readSubscriptions();
  if (existing.some((s) => s.endpoint === pushSubscription.endpoint)) {
    return;
  }

  await appendSubscription({
    endpoint: pushSubscription.endpoint,
    subscription: JSON.stringify(pushSubscription),
    created_at: new Date().toISOString(),
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  init();
  const all = await readSubscriptions();
  const remaining = all.filter((s) => s.endpoint !== endpoint);

  await clearSubscriptions();
  for (const s of remaining) {
    await appendSubscription(s);
  }
}

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

export async function notifyAllSubscribers(payload: {
  title?: string;
  body?: string;
  url?: string;
}): Promise<{ sent: number; failed: number }> {
  init();
  const rows = await readSubscriptions();
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    let sub: PushSubscriptionJSON;
    try {
      sub = JSON.parse(row.subscription);
    } catch {
      failed += 1;
      continue;
    }

    try {
      await webpush.sendNotification(
        sub as unknown as webpush.PushSubscription,
        JSON.stringify(payload),
        { TTL: 60 }
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await removeSubscription(sub.endpoint);
      }
      failed += 1;
    }
  }

  return { sent, failed };
}