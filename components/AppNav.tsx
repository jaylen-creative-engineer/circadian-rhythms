import Link from "next/link";

export function AppNav() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-semibold text-[#C8F135]">
          Circadian
        </Link>
        <div className="flex gap-4 text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-200">
            Dashboard
          </Link>
          <Link href="/display" className="hover:text-zinc-200">
            Display
          </Link>
          <Link href="/dashboard/settings" className="hover:text-zinc-200">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
