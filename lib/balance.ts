import type { Account, AccountBalance, Transaction } from "@/lib/types";

export function computeBalances(
  accounts: Account[],
  transactions: Transaction[]
): AccountBalance[] {
  const balances = new Map<string, number>();
  accounts.forEach((a) => balances.set(a.id, a.opening_balance));

  transactions.forEach((t) => {
    const byName = accounts.find((a) => a.name === t.account);
    if (!byName) return;

    if (t.type === "income") {
      balances.set(byName.id, (balances.get(byName.id) ?? 0) + t.amount);
    } else if (t.type === "expense") {
      balances.set(byName.id, (balances.get(byName.id) ?? 0) - t.amount);
    } else if (t.type === "transfer") {
      balances.set(byName.id, (balances.get(byName.id) ?? 0) - t.amount);
      const toAccount = accounts.find((a) => a.name === t.to_account);
      if (toAccount) {
        balances.set(toAccount.id, (balances.get(toAccount.id) ?? 0) + t.amount);
      }
    }
  });

  return accounts.map((a) => ({
    ...a,
    balance: Math.round((balances.get(a.id) ?? 0) * 100) / 100,
  }));
}