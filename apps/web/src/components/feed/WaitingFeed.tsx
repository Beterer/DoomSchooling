import { useState } from 'react';
import { BookOpenText, Check, LoaderCircle } from 'lucide-react';
import { Feed } from '@/components/feed/Feed';
import { WAITING_FEEDS } from '@/data/waitingFeeds';
import type { LearningDepth } from '@/lib/feed';

interface WaitingFeedProps {
  requestedTopic: string;
  depth: LearningDepth;
  isReady: boolean;
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function WaitingFeed({ requestedTopic, depth, isReady }: WaitingFeedProps) {
  // Shuffle once per mount so the temporary feeds aren't always in the same order.
  const [feeds] = useState(() => shuffle(WAITING_FEEDS));
  const [selectedFeedId, setSelectedFeedId] = useState(() => feeds[0].id);
  const selectedFeed = feeds.find((feed) => feed.id === selectedFeedId) ?? feeds[0];

  return (
    <div className={isReady ? 'pb-28 sm:pb-24' : ''} aria-busy={!isReady}>
      <section className="border-b border-feed-border bg-[linear-gradient(135deg,#eef2ff_0%,#f7fbff_55%,#effcf8_100%)] px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-feed-text text-white shadow-[3px_3px_0_#62d9ff]">
            {isReady ? (
              <Check aria-hidden="true" size={20} strokeWidth={3} />
            ) : (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={19} />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-accent">
              {isReady ? 'Your feed is ready' : 'Generating your feed'}
            </p>
            <h2 className="mt-1 truncate font-display text-lg font-black tracking-[-0.025em] text-feed-text">
              {requestedTopic}
            </h2>
            <p className="mt-1 text-sm leading-6 text-feed-text-secondary">
              {isReady
                ? 'This is a temporary feed. Open yours from the ready notice.'
                : 'Read a temporary feed below while you wait.'}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-feed-border bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpenText aria-hidden="true" className="text-feed-accent" size={16} />
            <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">
              Temporary reads
            </p>
          </div>
          <span className="font-utility text-[10px] text-feed-text-muted">
            {feeds.length} topics · scroll to browse
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {feeds.map((feed) => {
            const isSelected = feed.id === selectedFeed.id;

            return (
              <button
                key={feed.id}
                type="button"
                onClick={() => setSelectedFeedId(feed.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-left text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent ${
                  isSelected
                    ? 'border-feed-text bg-feed-text text-white shadow-[2px_2px_0_#62d9ff]'
                    : 'border-feed-border bg-feed-bg text-feed-text-secondary hover:border-feed-text-muted hover:bg-white'
                }`}
                aria-pressed={isSelected}
              >
                {feed.topicTitle}
              </button>
            );
          })}
        </div>
      </section>

      <div
        className={`temporary-feed-band sticky top-[8.5rem] z-10 flex items-center gap-3 border-b border-[#c88a08] px-4 py-3 shadow-[0_4px_14px_rgba(38,53,90,0.1)] sm:px-6 ${
          isReady ? '' : 'temporary-feed-band--loading'
        }`}
        aria-live="polite"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-feed-text text-white">
          {isReady ? (
            <Check aria-hidden="true" size={17} strokeWidth={3} />
          ) : (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full bg-[#c47600] ${
                isReady ? '' : 'temporary-feed-light'
              }`}
            />
            <p className="font-utility text-[11px] font-black uppercase tracking-[0.1em] text-feed-text">
              Temporary — not your feed
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-feed-text-secondary">
            {isReady
              ? 'Your feed is ready — use the notification.'
              : `Generating: ${requestedTopic}`}
          </p>
        </div>
        <span className="hidden max-w-44 truncate text-right font-utility text-[10px] text-feed-text-secondary sm:block">
          Reading: {selectedFeed.topicTitle}
        </span>
      </div>

      <div key={selectedFeed.id}>
        <Feed feed={selectedFeed} depth={depth} hideNextTopics />
      </div>
    </div>
  );
}
