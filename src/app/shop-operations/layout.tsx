import { AppShell } from "@/components/app-shell";

export default function ShopOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
