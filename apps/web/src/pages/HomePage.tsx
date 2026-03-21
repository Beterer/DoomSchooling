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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-zinc-100 mb-2 tracking-tight">
            DoomSchooling
          </h1>
          <p className="text-zinc-400 text-lg">Learn anything. Scroll everything.</p>
        </div>

        <TopicInput value={topic} onChange={setTopic} onSubmit={handleSubmit} />

        <div className="mt-6">
          <p className="text-zinc-500 text-sm mb-3">Try:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/feed?topic=${encodeURIComponent(t)}`)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-3 py-1.5 rounded-full transition-colors border border-zinc-700 hover:border-zinc-600"
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
