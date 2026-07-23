import { LoaderCircle, MessagesSquare } from 'lucide-react';

interface LoadingFeedProps {
  topic?: string;
  compact?: boolean;
}

function SkeletonPost({ inset = false }: { inset?: boolean }) {
  return (
    <div className={`animate-pulse border-b border-feed-border px-4 py-5 ${inset ? 'pl-9 sm:pl-14' : ''}`}>
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-feed-border-light" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 rounded bg-feed-border" />
            <div className="h-3 w-16 rounded bg-feed-border-light" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-full rounded bg-feed-border-light" />
            <div className="h-3.5 w-5/6 rounded bg-feed-border-light" />
            <div className="h-3.5 w-3/5 rounded bg-feed-border-light" />
          </div>
          <div className="mt-4 flex gap-10">
            <div className="h-3 w-10 rounded bg-feed-border-light" />
            <div className="h-3 w-10 rounded bg-feed-border-light" />
            <div className="h-3 w-7 rounded bg-feed-border-light" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingFeed({ topic, compact = false }: LoadingFeedProps) {
  return (
    <div aria-live="polite" aria-busy="true">
      <div className="flex items-start gap-3 border-b border-feed-border bg-feed-bg px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-feed-text text-white shadow-[3px_3px_0_#62d9ff]">
          <MessagesSquare aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <LoaderCircle aria-hidden="true" className="animate-spin text-feed-accent" size={15} />
            <p className="text-sm font-bold text-feed-text">
              {compact ? 'The conversation is continuing' : 'Bringing the five voices together'}
            </p>
          </div>
          {topic && <p className="mt-1 truncate text-sm text-feed-text-secondary">On: {topic}</p>}
        </div>
      </div>
      <SkeletonPost />
      <SkeletonPost inset />
      {!compact && <SkeletonPost />}
    </div>
  );
}
