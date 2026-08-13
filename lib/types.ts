export type AccountType = "cash" | "bank" | "ewallet" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  created_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  account: string;
  type: TransactionType;
  amount: number;
  to_account: string;
  note: string;
  created_at: string;
}

export interface AccountBalance extends Account {
  balance: number;
}