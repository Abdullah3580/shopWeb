export default function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return <div role="status" aria-label="Loading" className="space-y-4 animate-pulse">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-14 rounded-lg bg-slate-200" />)}<span className="sr-only">Loading...</span></div>;
}
