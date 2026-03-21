import { useNavigate } from 'react-router-dom';

interface EndOfFeedProps {
  topics: string[];
}

export function EndOfFeed({ topics }: EndOfFeedProps) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-feed-bg via-amber-50/30 to-rose-100/40 dark:from-feed-bg dark:via-amber-900/10 dark:to-rose-900/15" />

      <div className="relative px-6 pt-12 pb-16">
        {/* Divider pill */}
        <div className="flex justify-center mb-10">
          <div className="w-10 h-2 rounded-full bg-feed-text-muted/30" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-feed-text leading-snug mb-8">
          What do you want to learn next?
        </h2>

        {/* Topic pills */}
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => navigate(`/feed?topic=${encodeURIComponent(topic)}`)}
              className="text-left bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-feed-border/50 text-feed-text text-sm px-5 py-3.5 rounded-xl transition-colors hover:bg-white/90 dark:hover:bg-white/20"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
