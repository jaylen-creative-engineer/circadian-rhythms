import { Suspense } from "react";
import { DisplayView } from "@/components/DisplayView";

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-black text-zinc-600">
          …
        </div>
      }
    >
      <DisplayView />
    </Suspense>
  );
}
