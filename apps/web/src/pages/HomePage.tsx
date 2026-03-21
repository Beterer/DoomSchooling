import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopicInput } from '@/components/ui/TopicInput';

const EXAMPLE_TOPICS = [
  'JavaScript closures',
  'The French Revolution',
  'Sourdough baking',
  'Black holes',
  'Renaissance painting',
  'How TCP/IP works',
];

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const navigate = useNavigate();

  function handleSubmit() {
    const trimmed = topic.trim();
    if (!trimmed) return;
    navigate(`/feed?topic=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-feed-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-feed-text mb-3 tracking-tight">
            DoomSchooling
          </h1>
          <p className="text-feed-text-secondary text-lg">
            Learn anything. Scroll everything.
          </p>
        </div>

        <TopicInput value={topic} onChange={setTopic} onSubmit={handleSubmit} />

        <div className="mt-8 text-center">
          <p className="text-feed-text-muted text-sm mb-3">Popular topics</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/feed?topic=${encodeURIComponent(t)}`)}
                className="bg-transparent hover:bg-feed-accent/10 text-feed-text-secondary hover:text-feed-accent text-sm px-4 py-2 rounded-full transition-colors border border-feed-border hover:border-feed-accent/50"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
