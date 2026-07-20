import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildFeedUrl, type LearningDepth } from '@/lib/feed';

interface NextTopicsProps {
  topics: string[];
  depth: LearningDepth;
}

export function NextTopics({ topics, depth }: NextTopicsProps) {
  const navigate = useNavigate();

  return (
    <section className="border-b border-feed-border bg-feed-bg px-4 py-5 sm:px-6">
      <p className="font-utility text-xs font-semibold text-feed-text-muted">Change direction</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {topics.slice(0, 4).map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => navigate(buildFeedUrl(topic, depth))}
            className="group flex min-h-11 items-center justify-between gap-3 rounded-md border border-feed-border bg-feed-card px-3 py-2 text-left text-sm font-medium text-feed-text transition-colors hover:border-feed-text-muted hover:bg-feed-card-hover"
          >
            <span>{topic}</span>
            <ArrowRight aria-hidden="true" className="shrink-0 text-feed-text-muted group-hover:text-feed-accent" size={15} />
          </button>
        ))}
      </div>
    </section>
  );
}
