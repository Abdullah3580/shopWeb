"use client";

export default function GlobalRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">Please try again.</p>
        <button onClick={reset} className="mt-5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    </main>
  );
}
