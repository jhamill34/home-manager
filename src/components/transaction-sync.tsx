"use client";

import { api } from "~/trpc/react";
import { Button } from "./ui/button";

export function TransactionSync({ accountId }: { accountId: string }) {
  const { mutate, isLoading, isError } =
    api.bank.syncTransactions.useMutation();

  if (isError) {
    return <div className="bg-rose-400 p-4">Error</div>;
  }

  return (
    <Button onClick={() => mutate({ accountId })}>
      {isLoading ? "Loading..." : "Sync"}
    </Button>
  );
}
