export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-edge bg-surface p-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2 h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Editor + preview */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-36 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[68px] rounded-lg" />
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="mx-auto w-[300px] space-y-3 rounded-2xl border border-edge bg-surface p-4">
            <div className="skeleton mx-auto h-20 w-20 rounded-full" />
            <div className="skeleton mx-auto h-4 w-28" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
