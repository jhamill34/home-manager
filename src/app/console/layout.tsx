import { Navigation } from "~/components/navigation";

const navItems = [
  { label: "Home", href: "/console" },
  { label: "Settings", href: "/console/settings" },
];

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-muted">
        <div className="m-auto max-w-screen-lg">
          <Navigation items={navItems} />
        </div>
      </div>
      <div className="m-auto max-w-screen-lg p-4">{children}</div>
    </div>
  );
}
