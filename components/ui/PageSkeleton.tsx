interface PageSkeletonProps {
  cards?: number;
  showSidebar?: boolean;
}

export default function PageSkeleton({ cards = 4, showSidebar = false }: PageSkeletonProps) {
  return (
    <div className="academic-surface min-h-screen">
      <div className="h-16 border-b border-[#E2E8F0] bg-white" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-[#E2E8F0]" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#E2E8F0]" />
        <div className={`mt-8 grid gap-5 ${showSidebar ? 'lg:grid-cols-[1fr_20rem]' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          <div className={showSidebar ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'contents'}>
            {Array.from({ length: cards }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                <div className="h-36 bg-[#EFF6FF] sm:h-44" />
                <div className="space-y-3 p-4"><div className="h-4 w-4/5 rounded bg-[#E2E8F0]" /><div className="h-3 w-3/5 rounded bg-[#E2E8F0]" /><div className="h-8 w-full rounded bg-[#F1F5F9]" /></div>
              </div>
            ))}
          </div>
          {showSidebar && <div className="hidden lg:block rounded-lg border border-[#E2E8F0] bg-white p-5"><div className="h-5 w-24 rounded bg-[#E2E8F0]" /><div className="mt-5 space-y-3"><div className="h-4 rounded bg-[#E2E8F0]" /><div className="h-4 rounded bg-[#E2E8F0]" /><div className="h-10 rounded bg-[#E0F2FE]" /></div></div>}
        </div>
      </main>
    </div>
  );
}
