"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushSubscription } from "@/components/usePushSubscription";

export default function NotificationToggle() {
  const { supported, subscribed, loading, subscribe, unsubscribe } =
    usePushSubscription();

  if (!supported) return null;

  async function handleClick() {
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={subscribed ? "Matikan notifikasi" : "Aktifkan notifikasi"}
      aria-label={subscribed ? "Matikan notifikasi" : "Aktifkan notifikasi"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        subscribed
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : subscribed ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
    </button>
  );
}