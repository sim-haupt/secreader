export default function TickerLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-56 animate-pulse rounded-[32px] bg-white/80" />
        <div className="h-40 animate-pulse rounded-[32px] bg-white/80" />
        <div className="h-64 animate-pulse rounded-[32px] bg-white/80" />
      </div>
    </div>
  );
}
