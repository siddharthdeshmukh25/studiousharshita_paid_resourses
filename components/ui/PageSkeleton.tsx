interface PageSkeletonProps {
  cards?: number;
  showSidebar?: boolean;
}

export default function PageSkeleton({ cards = 4, showSidebar = false }: PageSkeletonProps) {
  return (
    <div className="academic-surface min-h-screen">
      <div className="h-16 border-b border-[var(--line)] bg-[#FFFDF8]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-[var(--line)]" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-[var(--line)]" />
        <div className={`mt-8 grid gap-5 ${showSidebar ? 'lg:grid-cols-[1fr_20rem]' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          <div className={showSidebar ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'contents'}>
            {Array.from({ length: cards }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-[var(--line)] bg-[#FFFDF8]">
                <div className="h-36 bg-[var(--sage-soft)] sm:h-44" />
                <div className="space-y-3 p-4"><div className="h-4 w-4/5 rounded bg-[var(--line)]" /><div className="h-3 w-3/5 rounded bg-[var(--line)]" /><div className="h-8 w-full rounded bg-[var(--accent-soft)]" /></div>
              </div>
            ))}
          </div>
          {showSidebar && <div className="hidden lg:block rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-5"><div className="h-5 w-24 rounded bg-[var(--line)]" /><div className="mt-5 space-y-3"><div className="h-4 rounded bg-[var(--line)]" /><div className="h-4 rounded bg-[var(--line)]" /><div className="h-10 rounded bg-[var(--accent-soft-2)]" /></div></div>}
        </div>
      </main>
    </div>
  );
}
