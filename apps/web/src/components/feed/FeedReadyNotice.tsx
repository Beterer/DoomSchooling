import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface FeedReadyNoticeProps {
  topic: string;
  onOpen: () => void;
}

export function FeedReadyNotice({ topic, onOpen }: FeedReadyNoticeProps) {
  return (
    <div
      className="feed-ready-notice fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0"
      role="status"
      aria-live="assertive"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group w-full rounded-2xl border-2 border-feed-text bg-white p-1 text-left shadow-[6px_6px_0_#62d9ff] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent focus-visible:ring-offset-4"
      >
        <span className="flex items-center gap-3 rounded-xl bg-feed-text px-4 py-3.5 text-white">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#62d9ff] text-feed-text">
            <Check aria-hidden="true" size={21} strokeWidth={3} />
            <Sparkles
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 text-[#ffd166]"
              fill="currentColor"
              size={15}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ee8ff]">
              Your feed is ready
            </span>
            <span className="mt-0.5 block truncate text-sm font-bold">{topic}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#9ee8ff]">
            Open
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
              size={16}
            />
          </span>
        </span>
      </button>
    </div>
  );
}
