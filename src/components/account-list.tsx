"use client";

import { api } from "~/trpc/react";
import { TransactionSync } from "./transaction-sync";
import { useState } from "react";
import { Button } from "./ui/button";

export function AccountList() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const { data, isLoading, isError } = api.bank.listAccounts.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !data) {
    return <div>Error</div>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-800 border border-gray-800">
        {data.accounts.map((account) => (
          <li key={account.id} className="flex items-center p-4 gap-2">
            <div className="flex-1">{account.name}</div>

            <Button onClick={() => setSelectedAccountId(account.id)}>
              Select
            </Button>
            <TransactionSync accountId={account.id} />
          </li>
        ))}
      </ul>
      {selectedAccountId !== null && <TransactionList accountId={selectedAccountId} />}
    </>
  );
}

function TransactionList({ accountId }: { accountId: string }) {
  const { data, isLoading, isError } = api.bank.listTransactions.useQuery({
    accountId,
    limit: 50,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !data) {
    return <div>Error</div>;
  }

  return (
    <ul className="divide-y divide-gray-800">
      {data.map((transaction) => (
        <li key={transaction.id} className="flex items-center p-4">
          <div className="flex-1">
            {transaction.date.toLocaleDateString()} {transaction.description} - {transaction.amount}
          </div>
        </li>
      ))}
    </ul>
  );
}
