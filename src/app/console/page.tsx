import { api } from "~/trpc/server"

export default function ConsolePage() {
  const a = api.bank.syncAccounts.query();

  console.log(a);
	return (
		<div>
			Hello console!
		</div>
	)
}
