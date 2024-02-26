import { AccountList } from "~/components/account-list";
import { AccountSync } from "~/components/account-sync";

export default async function ConsolePage() {
	return (
    <div>
      <div className="mb-4 flex gap-2">
        <AccountSync />
      </div>

      <AccountList />
    </div>
	)
}
