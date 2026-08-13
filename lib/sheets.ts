import { google, type sheets_v4 } from "googleapis";
import { existsSync, readFileSync } from "fs";
import path from "path";
import type { Account, Transaction } from "@/lib/types";

let cachedClient: sheets_v4.Sheets | null = null;
let structureChecked = false;
let structurePromise: Promise<void> | null = null;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const readCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 4000;

function cacheGet<T>(key: string): T | null {
  const entry = readCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    readCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  readCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheInvalidate(key: string): void {
  readCache.delete(key);
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";

function getCredentials(): string {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    return Buffer.from(
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf-8");
  }

  const filePath = path.join(
    process.cwd(),
    "credentials",
    "service-account.json"
  );

  try {
    return existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  } catch {
    return "";
  }
}

export async function getSheets(): Promise<sheets_v4.Sheets> {
  if (cachedClient) return cachedClient;

  if (!SPREADSHEET_ID) {
    throw new Error("SPREADSHEET_ID belum diatur di file .env.local");
  }

  const credentialsJson = getCredentials();
  if (!credentialsJson) {
    throw new Error(
      "Kredensial service account belum tersedia. Letakkan di credentials/service-account.json atau set GOOGLE_SERVICE_ACCOUNT_BASE64."
    );
  }

  const credentials = JSON.parse(credentialsJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function getSpreadsheetId(): string {
  return SPREADSHEET_ID;
}

const ACCOUNTS_HEADERS = ["id", "name", "type", "opening_balance", "created_at"];
const TRANSACTIONS_HEADERS = [
  "id",
  "date",
  "description",
  "account",
  "type",
  "amount",
  "to_account",
  "note",
  "created_at",
];
const SUBSCRIPTIONS_HEADERS = ["endpoint", "subscription", "created_at"];

async function ensureSheet(
  sheets: sheets_v4.Sheets,
  title: string,
  headers: string[]
): Promise<void> {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = res.data.sheets?.some((s) => s.properties?.title === title);

  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title },
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${title}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

export async function ensureStructure(): Promise<void> {
  if (structureChecked) return;
  if (structurePromise) return structurePromise;

  const sheets = await getSheets();
  structurePromise = (async () => {
    await ensureSheet(sheets, "Accounts", ACCOUNTS_HEADERS);
    await ensureSheet(sheets, "Transactions", TRANSACTIONS_HEADERS);
    await ensureSheet(sheets, "Subscriptions", SUBSCRIPTIONS_HEADERS);
    structureChecked = true;
  })();

  try {
    await structurePromise;
  } finally {
    structurePromise = null;
  }
}

function rowsToObjects<T>(rows: string[][]): T[] {
  if (!rows || rows.length === 0) return [];

  const [headerRow, ...dataRows] = rows;
  const lower = headerRow.map((h) => h.toLowerCase());

  return dataRows
    .filter((r) => r.some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const obj: Record<string, unknown> = {};
      lower.forEach((key, i) => {
        obj[key] = row[i] ?? "";
      });
      return obj as unknown as T;
    });
}

export async function readAccounts(): Promise<Account[]> {
  const cacheKey = "accounts";
  const cached = cacheGet<Account[]>(cacheKey);
  if (cached) return cached;

  const sheets = await getSheets();
  await ensureStructure();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Accounts!A:E",
  });

  const data = rowsToObjects<Account>(res.data.values ?? []).map(
    (a) => ({ ...a, opening_balance: Number(a.opening_balance) || 0 })
  );

  cacheSet(cacheKey, data);
  return data;
}

export async function readTransactions(): Promise<Transaction[]> {
  const cacheKey = "transactions";
  const cached = cacheGet<Transaction[]>(cacheKey);
  if (cached) return cached;

  const sheets = await getSheets();
  await ensureStructure();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Transactions!A:I",
  });

  const data = rowsToObjects<Transaction>(res.data.values ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount) || 0,
  }));

  cacheSet(cacheKey, data);
  return data;
}

export async function appendAccount(
  account: Omit<Account, "created_at">
): Promise<void> {
  const sheets = await getSheets();
  await ensureStructure();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Accounts!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          account.id,
          account.name,
          account.type,
          account.opening_balance,
          new Date().toISOString(),
        ],
      ],
    },
  });

  cacheInvalidate("accounts");
}

export async function appendTransaction(
  transaction: Omit<Transaction, "created_at">
): Promise<void> {
  const sheets = await getSheets();
  await ensureStructure();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Transactions!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          transaction.id,
          transaction.date,
          transaction.description,
          transaction.account,
          transaction.type,
          transaction.amount,
          transaction.to_account,
          transaction.note,
          new Date().toISOString(),
        ],
      ],
    },
  });

  cacheInvalidate("transactions");
}

export interface PushSubscriptionRow {
  endpoint: string;
  subscription: string;
  created_at: string;
}

export async function readSubscriptions(): Promise<PushSubscriptionRow[]> {
  const sheets = await getSheets();
  await ensureStructure();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Subscriptions!A:C",
  });

  return rowsToObjects<PushSubscriptionRow>(res.data.values ?? []);
}

export async function appendSubscription(
  subscription: PushSubscriptionRow
): Promise<void> {
  const sheets = await getSheets();
  await ensureStructure();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Subscriptions!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          subscription.endpoint,
          subscription.subscription,
          subscription.created_at,
        ],
      ],
    },
  });
}

export async function clearSubscriptions(): Promise<void> {
  const sheets = await getSheets();
  await ensureStructure();

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Subscriptions!A2:C",
  });
}