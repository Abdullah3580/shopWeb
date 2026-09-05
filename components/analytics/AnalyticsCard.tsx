'use client';

export default function AnalyticsCard({ title, value, unit = '৳' }: { title: string; value: number; unit?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {unit === '৳' ? `৳${value.toLocaleString()}` : `${value} ${unit}`}
      </p>
    </div>
  );
}
