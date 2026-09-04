import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
export default function Loading() { return <main className="min-h-screen bg-slate-100 p-5 md:p-8"><div className="max-w-2xl mx-auto"><div className="h-9 w-56 rounded bg-slate-200 animate-pulse mb-8" /><LoadingSkeleton rows={7} /></div></main>; }
