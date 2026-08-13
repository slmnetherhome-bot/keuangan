# Keuangan

Aplikasi pengelola keuangan sederhana (single-entry) yang terintegrasi dengan Google Sheets.

## Fitur

- **Dashboard** — ringkasan total saldo, pemasukan/pengeluaran bulan ini, saldo per akun, dan transaksi terakhir.
- **Transaksi** — catat pemasukan, pengeluaran, dan transfer antar akun.
- **Akun (chart of accounts)** — kelola akun seperti Kas, Bank, E-Wallet, dll.
- **PWA** — dapat diinstall sebagai app di perangkat (mobile/desktop), navigasi bottom bar di mobile.
- **Push Notification** — notifikasi real-time ke semua perangkat saat transaksi baru dicatat.

## Arsitektur

- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Data: Google Sheets (API v4) via service account
- Push: Web Push (VAPID) via `web-push`
- Sheet `Accounts`: `id, name, type, opening_balance, created_at`
- Sheet `Transactions`: `id, date, description, account, type, amount, to_account, note, created_at`
- Sheet `Subscriptions`: `endpoint, subscription, created_at` (untuk push notification)

## Setup

### 1. Buat Google Spreadsheet

1. Buka [sheets.new](https://sheets.new) dan buat spreadsheet baru.
2. Salin ID spreadsheet dari URL (bagian antara `/d/` dan `/edit`).
3. Bagikan spreadsheet ke email service account (lihat langkah 2) dengan akses **Editor**.

### 2. Buat Service Account

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project (atau pakai yang sudah ada), lalu aktifkan **Google Sheets API**.
3. Pergi ke **IAM & Admin → Service Accounts**, buat service account baru.
4. Klik service account → **Keys** → **Add Key → Create new key** → pilih **JSON** → unduh filenya.
5. Simpan file JSON tersebut sebagai `credentials/service-account.json` di folder project.
   - Alternatif: encode file menjadi base64 dan set di env `GOOGLE_SERVICE_ACCOUNT_BASE64`.

### 3. Konfigurasi Env

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi `SPREADSHEET_ID` dengan ID spreadsheet dari langkah 1.

### 3b. Konfigurasi Push Notification (opsional tapi disarankan)

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Isi `.env.local`:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dengan public key
   - `VAPID_PRIVATE_KEY` dengan private key
   - `VAPID_SUBJECT` dengan `mailto:email-anda@contoh.com`

> Catatan: Push notification butuh HTTPS (atau `localhost` saat development) agar bisa aktif di browser.

### 4. Jalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Struktur sheet (`Accounts`, `Transactions`, `Subscriptions`) akan dibuat otomatis saat pertama kali data diakses.

### 5. Install sebagai PWA

1. Buka app di browser.
2. Klik ikon install di address bar (Chrome) atau menu browser → **Add to Home Screen** (iOS Safari).
3. Buka Dashboard → **Aktifkan Notifikasi** untuk menerima push notification.

Saat transaksi baru dicatat dari satu perangkat, semua perangkat yang sudah subscribe akan menerima notifikasi.

## Deploy ke Vercel

> **Penting soal keamanan**: `credentials/` dan `.env.local` tidak di-commit ke git. Di Vercel tidak ada file lokal, jadi semua konfigurasi harus lewat **Environment Variables** di dashboard Vercel.

### 1. Siapkan Environment Variables di Vercel

Di **Vercel Dashboard → Project → Settings → Environment Variables**, tambahkan:

| Nama | Nilai |
|---|---|
| `SPREADSHEET_ID` | ID spreadsheet Google Sheets kamu |
| `GOOGLE_SERVICE_ACCOUNT_BASE64` | Isi kredensial service account dalam base64 (lihat cara di bawah) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key VAPID |
| `VAPID_PRIVATE_KEY` | Private key VAPID |
| `VAPID_SUBJECT` | `mailto:email-anda@contoh.com` |

Untuk menghasilkan `GOOGLE_SERVICE_ACCOUNT_BASE64` dari file `credentials/service-account.json`:

```bash
npm run env:base64
```

Salin output-nya ke kolom `GOOGLE_SERVICE_ACCOUNT_BASE64` di Vercel.

### 2. Deploy

Karena repo sudah terhubung ke GitHub, deploy otomatis terjadi setiap push ke `main`. Untuk deploy manual pertama:

```bash
npx vercel
```

Atau gunakan **Vercel Dashboard → Add New → Project → import** dari repo `slmnetherhome-bot/keuangan`.

> Setiap perubahan di `vercel.json` (header `sw.js`, manifest, icon) otomatis diterapkan saat redeploy.

### 3. Setelah Deploy

1. Buka URL `https://<project>.vercel.app`.
2. Pastikan Google Sheets API aktif & spreadsheet sudah di-share ke email service account.
3. Install PWA & aktifkan notifikasi seperti pada Setup langkah 5.

> Push notification hanya berjalan di HTTPS (Vercel otomatis menyediakannya).

## Script

- `npm run dev` — development server
- `npm run build` — build production
- `npm run lint` — lint
- `npm run env:base64` — generate base64 service account untuk env Vercel
