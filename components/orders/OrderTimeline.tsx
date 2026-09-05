'use client';

interface LogEntry {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
}

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderTimeline({
  currentStatus,
  timeline
}: {
  currentStatus: string;
  timeline: LogEntry[];
}) {
  const activeIndex = STEPS.indexOf(currentStatus.toLowerCase());

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-base font-semibold text-gray-900">Order Progress</h3>
      
      <div className="relative flex justify-between">
        {STEPS.map((step, idx) => {
          const isPassed = idx <= (activeIndex === -1 ? 0 : activeIndex);
          return (
            <div key={step} className="z-10 flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  isPassed ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx + 1}
              </div>
              <span className="mt-2 text-xs font-medium capitalize text-gray-700">
                {step}
              </span>
            </div>
          );
        })}
        <div className="absolute top-4 left-4 right-4 -z-0 h-0.5 bg-gray-200" />
      </div>

      {timeline.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Activity Log</h4>
          <ul className="mt-3 space-y-3">
            {timeline.map((log) => (
              <li key={log.id} className="flex justify-between text-xs">
                <span className="font-semibold text-gray-800 capitalize">
                  {log.status} - <span className="font-normal text-gray-600">{log.notes || 'Status updated'}</span>
                </span>
                <span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
