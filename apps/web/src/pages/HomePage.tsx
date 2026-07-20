import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopicInput } from '@/components/ui/TopicInput';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { TOPIC_POOL } from '@/data/topics';
import { buildFeedUrl, DEFAULT_DEPTH, type LearningDepth } from '@/lib/feed';

function pickRandomTopics(count: number): string[] {
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<LearningDepth>(DEFAULT_DEPTH);
  const navigate = useNavigate();
  const exampleTopics = useMemo(() => pickRandomTopics(6), []);

  function handleSubmit() {
    const trimmed = topic.trim();
    if (!trimmed) return;
    navigate(buildFeedUrl(trimmed, depth));
  }

  return (
    <div className="min-h-screen bg-feed-bg text-feed-text">
      <SiteHeader />

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <section className="grid min-h-[calc(100vh-12rem)] items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-20 lg:py-16">
          <div className="max-w-2xl">
            <div className="mb-7 flex items-center gap-3 text-sm font-semibold text-feed-accent">
              <span className="h-2.5 w-2.5 rounded-full bg-feed-signal" />
              A feed worth remembering
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.02] text-feed-text sm:text-6xl lg:text-7xl">
              DoomSchooling
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-feed-text-secondary sm:text-xl">
              Put any subject in the middle of five sharp minds. Learn through questions,
              examples, pushback, and the occasional useful argument.
            </p>

            <div className="mt-9">
              <TopicInput
                value={topic}
                depth={depth}
                onChange={setTopic}
                onDepthChange={setDepth}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <aside className="border-t border-feed-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-feed-text">Start somewhere</h2>
              <span className="font-utility text-xs text-feed-text-muted">6 prompts</span>
            </div>
            <div className="divide-y divide-feed-border border-y border-feed-border">
              {exampleTopics.map((exampleTopic) => (
                <button
                  key={exampleTopic}
                  type="button"
                  onClick={() => navigate(buildFeedUrl(exampleTopic, depth))}
                  className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-feed-text transition-colors hover:text-feed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent"
                >
                  <span>{exampleTopic}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="shrink-0 text-feed-text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-feed-accent"
                    size={17}
                  />
                </button>
              ))}
            </div>
          </aside>
        </section>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-feed-border py-6 font-utility text-xs text-feed-text-muted">
          <span className="font-semibold text-feed-text-secondary">Five voices</span>
          {['Expert', 'Practitioner', 'Learner', 'Skeptic', 'Enthusiast'].map((role, index) => (
            <span key={role} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full role-dot-${index + 1}`} />
              {role}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
