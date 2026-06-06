import { AppNav } from "@/components/AppNav";
import { DashboardView } from "@/components/DashboardView";

export default function DashboardPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <DashboardView />
      </main>
    </>
  );
}
