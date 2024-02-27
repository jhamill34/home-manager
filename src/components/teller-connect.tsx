"use client";

import { useTellerConnect } from "teller-connect-react";
import { Button } from "./ui/button";
import { api } from "~/trpc/react";

export default function TellerConnect({ appId }: { appId: string }) {
  const { mutate } = api.bank.create.useMutation();

  const { open, ready } = useTellerConnect({
    applicationId: appId,
    onSuccess: (auth) => {
      mutate({
        userId: auth.user.id,
        accessToken: auth.accessToken,
        enrollmentId: auth.enrollment.id,
        institutionName: auth.enrollment.institution.name,
      });
    },
  });

  return (
    <Button onClick={() => open()} disabled={!ready}>
      Connect Bank
    </Button>
  );
}
