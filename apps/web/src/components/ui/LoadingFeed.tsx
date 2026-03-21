function SkeletonPost({ indent = 0 }: { indent?: number }) {
  return (
    <div className="flex gap-2" style={{ paddingLeft: `${indent * 20}px` }}>
      {indent > 0 && (
        <div className="w-0.5 bg-zinc-700 rounded-full flex-shrink-0" />
      )}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-28 bg-zinc-700 rounded mb-1.5" />
            <div className="h-2.5 w-20 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-5/6" />
          <div className="h-3 bg-zinc-800 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

export function LoadingFeed() {
  return (
    <div className="space-y-2">
      <SkeletonPost indent={0} />
      <SkeletonPost indent={1} />
      <SkeletonPost indent={1} />
      <SkeletonPost indent={0} />
      <SkeletonPost indent={1} />
      <SkeletonPost indent={2} />
      <SkeletonPost indent={0} />
    </div>
  );
}
