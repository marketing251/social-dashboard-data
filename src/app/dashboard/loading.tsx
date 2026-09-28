export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section>
        <div className="h-5 w-64 bg-border rounded-sm mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-lg" />
          ))}
        </div>
      </section>
      <section>
        <div className="h-5 w-48 bg-border rounded-sm mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-card border border-border rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
