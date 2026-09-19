export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8" aria-busy="true" aria-label="Loading settings">
      <div className="space-y-2">
        <div className="skeleton h-7 w-32" />
        <div className="skeleton h-4 w-64" />
      </div>

      <section className="rounded-lg border border-edge bg-surface p-6">
        <div className="skeleton h-5 w-24" />
        <div className="mt-6 flex items-center gap-4">
          <div className="skeleton h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-9 w-full max-w-sm rounded-lg" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-20 w-full rounded-lg" />
        </div>
      </section>

      <section className="rounded-lg border border-edge bg-surface p-6">
        <div className="skeleton h-5 w-28" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-28 rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}
