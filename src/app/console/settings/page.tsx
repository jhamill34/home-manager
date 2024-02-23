import { api } from "~/trpc/server";
import { env } from "~/env";
import TellerConnect from "~/components/teller-connect";
import { type RouterOutputs } from "~/trpc/shared";

type BankEntity = RouterOutputs["bank"]["get"];

export default async function SettingsPage() {
  const banks = await api.bank.get.query();

  return (
    <div>
      <h1 className="text-2xl font-semibold border-b border-muted pb-4">Settings</h1>
      <BankItem bank={banks} />
    </div>
  );
}

function BankItem({ bank }: { bank: BankEntity }) {
  if (bank === undefined) {
    return <TellerConnect appId={env.TELLER_APP_ID} />;
  }

  return (
    <div className="p-4">
      Connected to <span className="font-semibold text-primary">{bank.institutionName}</span>
    </div>
  );
}
