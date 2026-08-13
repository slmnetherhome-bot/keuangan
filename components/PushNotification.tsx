"use client";

import { Bell, BellOff, Send, Loader2 } from "lucide-react";
import { usePushSubscription } from "@/components/usePushSubscription";

export default function PushNotification() {
  const {
    supported,
    subscribed,
    loading,
    status,
    subscribe,
    unsubscribe,
    test,
  } = usePushSubscription();

  if (!supported) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold">Notifikasi</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Terima notifikasi push di perangkat ini (perlu diinstall sebagai app).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!subscribed ? (
          <button
            type="button"
            onClick={subscribe}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {loading ? "Memproses..." : "Aktifkan Notifikasi"}
          </button>
        ) : (
          <button
            type="button"
            onClick={unsubscribe}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            {loading ? "Memproses..." : "Matikan Notifikasi"}
          </button>
        )}

        {subscribed && (
          <button
            type="button"
            onClick={test}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Mengirim..." : "Kirim Tes"}
          </button>
        )}
      </div>

      {status && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      )}
    </div>
  );
}