"use client";

import { api } from "~/trpc/react";
import { Button } from "./ui/button";

export function AccountSync() {
  const { mutate, isLoading, isError } = api.bank.syncAccounts.useMutation();

  if (isError) {
    return <div>Something went wrong...</div>;
  }

  return (
    <Button onClick={() => mutate()}>
      {isLoading ? "Loading..." : "Sync Accounts"}
    </Button>
  );
}
