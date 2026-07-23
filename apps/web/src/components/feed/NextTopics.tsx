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
    <section className="border-b border-feed-border bg-feed-bg px-4 py-6 sm:px-6">
      <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">Change direction</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {topics.slice(0, 4).map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => navigate(buildFeedUrl(topic, depth))}
            className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-feed-border bg-feed-card px-3 py-2 text-left text-sm font-bold text-feed-text transition-all hover:-translate-y-0.5 hover:border-feed-accent/40 hover:shadow-sm"
          >
            <span>{topic}</span>
            <ArrowRight aria-hidden="true" className="shrink-0 text-feed-text-muted group-hover:text-feed-accent" size={15} />
          </button>
        ))}
      </div>
    </section>
  );
}
