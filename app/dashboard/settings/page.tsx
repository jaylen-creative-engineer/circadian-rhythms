"use client";

import { SessionProvider } from "next-auth/react";
import { AppNav } from "@/components/AppNav";
import { SettingsView } from "@/components/SettingsView";

export default function SettingsPage() {
  return (
    <SessionProvider>
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <SettingsView />
      </main>
    </SessionProvider>
  );
}
