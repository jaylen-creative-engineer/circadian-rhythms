import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Circadian Intelligence",
  description: "Privacy policy for personal WHOOP circadian rhythm app",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <section>
          <h2 className="font-medium text-zinc-100">Overview</h2>
          <p className="mt-2">
            Circadian Intelligence is a personal, self-hosted app that reads
            WHOOP sleep and recovery data to generate circadian rhythm
            predictions. It is not a commercial product and is used only by
            its owner.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-100">Data we collect</h2>
          <p className="mt-2">
            When you connect your WHOOP account, the app requests access to
            sleep, recovery, cycle, and body measurement data via the WHOOP
            API. This includes metrics such as sleep stages, HRV, resting
            heart rate, and sleep performance scores.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-100">How data is used</h2>
          <p className="mt-2">
            WHOOP data is used solely to compute personal energy peaks,
            cognitive dips, groggy windows, and melatonin timing
            predictions. Data is not sold, shared with third parties, or used
            for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-100">Data storage</h2>
          <p className="mt-2">
            Sleep records, OAuth tokens, and computed predictions are stored in
            a private Supabase database. Access is limited to the app owner.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-100">Disconnecting</h2>
          <p className="mt-2">
            You can revoke the app&apos;s access at any time through your
            WHOOP account settings or by disconnecting within this app.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-100">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be directed to the app owner via
            the contact method associated with this deployment.
          </p>
        </section>
      </div>
    </main>
  );
}
