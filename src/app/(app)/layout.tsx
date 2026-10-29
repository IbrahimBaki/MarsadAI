import { AppProvider } from "@/components/AppContext";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
