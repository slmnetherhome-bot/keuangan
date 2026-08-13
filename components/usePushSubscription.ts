"use client";

import { useCallback, useEffect, useState } from "react";

export function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSupport() {
      if (cancelled) return;
      setSupported(
        typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window
      );
    }
    checkSupport();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncState = useCallback(async () => {
    if (!supported) return;

    if (Notification.permission !== "granted") {
      setSubscribed(false);
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          setSwReady(true);
          return syncState();
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, [supported, syncState]);

  async function subscribe() {
    setLoading(true);
    setStatus(null);
    try {
      if (!swReady) {
        await navigator.serviceWorker.register("/sw.js");
        setSwReady(true);
      }

      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setStatus("Izin notifikasi ditolak.");
          return false;
        }
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setStatus("VAPID public key belum dikonfigurasi.");
          return false;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Gagal menyimpan subscription");
      }

      setSubscribed(true);
      setStatus("Notifikasi aktif di perangkat ini.");
      return true;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Terjadi kesalahan");
      return false;
    } finally {
      setLoading(false);
      syncState();
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setStatus(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setSubscribed(false);
      setStatus("Notifikasi dimatikan di perangkat ini.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function test() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Tes Notifikasi",
          message: "Notifikasi berfungsi dengan baik!",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim notifikasi");
      }
      setStatus(
        data.sent > 0
          ? `Notifikasi terkirim ke ${data.sent} perangkat.`
          : "Tidak ada perangkat yang menerima (belum ada yang subscribe)."
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return { supported, subscribed, loading, status, subscribe, unsubscribe, test };
}