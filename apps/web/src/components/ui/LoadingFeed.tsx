function SkeletonPost({ indent = 0 }: { indent?: number }) {
  return (
    <div
      className="px-4 py-3 border-b border-feed-border animate-pulse"
      style={{ paddingLeft: `${16 + indent * 28}px` }}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-feed-border flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3.5 w-24 bg-feed-border rounded" />
            <div className="h-3 w-20 bg-feed-border-light rounded" />
            <div className="h-3 w-10 bg-feed-border-light rounded" />
          </div>
          <div className="space-y-2 mt-2">
            <div className="h-3.5 bg-feed-border-light rounded w-full" />
            <div className="h-3.5 bg-feed-border-light rounded w-5/6" />
            <div className="h-3.5 bg-feed-border-light rounded w-3/5" />
          </div>
          <div className="flex gap-16 mt-4">
            <div className="h-3 w-8 bg-feed-border-light rounded" />
            <div className="h-3 w-8 bg-feed-border-light rounded" />
            <div className="h-3 w-8 bg-feed-border-light rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingFeed() {
  return (
    <div>
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
