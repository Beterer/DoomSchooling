import { useNavigate } from 'react-router-dom';

interface NextTopicsProps {
  topics: string[];
}

export function NextTopics({ topics }: NextTopicsProps) {
  const navigate = useNavigate();

  return (
    <div className="border-t border-zinc-800 pt-6 pb-10">
      <h2 className="text-zinc-400 text-xs font-medium mb-3 uppercase tracking-widest">
        What to learn next
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => navigate(`/feed?topic=${encodeURIComponent(topic)}`)}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 text-sm px-4 py-2 rounded-full transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
