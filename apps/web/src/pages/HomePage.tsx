import { useMemo, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
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
        <section className="grid min-h-[calc(100vh-10rem)] items-center gap-12 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:gap-16 lg:py-16">
          <div className="max-w-[700px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-feed-border bg-white px-3 py-1.5 text-xs font-bold text-feed-accent shadow-sm">
              <Sparkles aria-hidden="true" size={14} />
              Your curiosity, with a better algorithm
            </div>
            <h1 className="font-display text-[3.6rem] font-black leading-[0.94] tracking-[-0.065em] text-feed-text sm:text-7xl lg:text-[5.35rem]">
              Learn anything.
              <br />
              Keep <span className="hero-mark">scrolling.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-feed-text-secondary sm:text-xl">
              Turn any question into a lively feed where five distinct minds explain,
              challenge, and connect the dots.
            </p>

            <div className="mt-8">
              <TopicInput
                value={topic}
                depth={depth}
                onChange={setTopic}
                onDepthChange={setDepth}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          <aside>
            <div className="relative mx-auto max-w-[430px]">
              <div aria-hidden="true" className="absolute -right-3 -top-3 h-full w-full rotate-2 rounded-[2rem] bg-[#62d9ff]" />
              <div className="relative overflow-hidden rounded-[2rem] border border-feed-border bg-white shadow-[0_24px_70px_rgba(38,53,90,0.14)]">
                <div className="flex items-center justify-between border-b border-feed-border px-5 py-4">
                  <div>
                    <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">
                      Live discussion
                    </p>
                    <p className="mt-0.5 font-display text-lg font-black tracking-[-0.03em]">Why do habits stick?</p>
                  </div>
                  <span className="flex h-8 items-center rounded-full bg-[#eaf7f3] px-3 text-[11px] font-bold text-[#008f7a]">
                    5 voices
                  </span>
                </div>
                <div className="divide-y divide-feed-border-light">
                  {[
                    { initials: 'DR', name: 'Dr. Reyes', role: 'Expert', color: '#3457d5', text: 'Habits are less about willpower and more about reliable cues.' },
                    { initials: 'MK', name: 'Mika', role: 'Skeptic', color: '#ff5c5c', text: 'Then why do the "perfect" routines still fall apart?' },
                    { initials: 'JO', name: 'Jo', role: 'Practitioner', color: '#008f7a', text: 'Because the routine has to survive an ordinary bad Tuesday.' },
                  ].map((voice) => (
                    <div key={voice.name} className="feed-preview-row flex gap-3 px-5 py-4">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ backgroundColor: voice.color }}
                      >
                        {voice.initials}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-feed-text">{voice.name}</span>
                          <span
                            className="rounded-full px-2 py-0.5 font-utility text-[9px] font-bold uppercase tracking-wide"
                            style={{ color: voice.color, backgroundColor: `${voice.color}14` }}
                          >
                            {voice.role}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-feed-text-secondary">{voice.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-feed-border py-8 sm:py-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-feed-accent">Need a spark?</p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-[-0.035em] text-feed-text">Pick a rabbit hole</h2>
            </div>
            <span className="text-xs text-feed-text-muted">Fresh prompts every visit</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {exampleTopics.map((exampleTopic) => (
                <button
                  key={exampleTopic}
                  type="button"
                  onClick={() => navigate(buildFeedUrl(exampleTopic, depth))}
                  className="group flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-feed-border bg-white px-4 py-3 text-left text-sm font-bold text-feed-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-feed-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent"
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
        </section>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-feed-border py-6 font-utility text-[11px] text-feed-text-muted">
          <span className="font-bold uppercase tracking-wider text-feed-text-secondary">The cast</span>
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
