import Link from "next/link";
import { Button } from "./ui/button";

type NavigationItem = {
	label: string;
	href: string;
}

type NavigationProps = {
	items: NavigationItem[];
}

export function Navigation({ items }: NavigationProps) {
	return (
		<nav>
			<ul className="flex gap-x-2 py-4">
				{items.map((item) => (
					<li key={item.label}>
						<Button asChild variant="link">
							<Link href={item.href}>{item.label}</Link>
						</Button>
					</li>
				))}
			</ul>
		</nav>
	)
}
