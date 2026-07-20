import { ArrowRight, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildFeedUrl, type LearningDepth } from '@/lib/feed';

interface EndOfFeedProps {
  topics: string[];
  depth: LearningDepth;
}

export function EndOfFeed({ topics, depth }: EndOfFeedProps) {
  const navigate = useNavigate();

  return (
    <section className="border-t border-feed-border bg-feed-bg px-5 py-10 sm:px-8">
      <Compass aria-hidden="true" className="text-feed-signal" size={24} />
      <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-feed-text">
        Follow the next question
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-feed-text-secondary">
        This thread has reached its last round. Pick a nearby idea and keep the same learning depth.
      </p>

      <div className="mt-6 divide-y divide-feed-border border-y border-feed-border">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => navigate(buildFeedUrl(topic, depth))}
            className="group flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-semibold text-feed-text transition-colors hover:text-feed-accent"
          >
            <span>{topic}</span>
            <ArrowRight aria-hidden="true" className="shrink-0 text-feed-text-muted group-hover:text-feed-accent" size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}
