import { useNavigate } from 'react-router-dom';

interface NextTopicsProps {
  topics: string[];
}

export function NextTopics({ topics }: NextTopicsProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-feed-border px-4 py-4">
      <h2 className="text-feed-text font-bold text-xl mb-3">
        What to learn next
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => navigate(`/feed?topic=${encodeURIComponent(topic)}`)}
            className="bg-transparent hover:bg-feed-accent/10 border border-feed-border hover:border-feed-accent/50 text-feed-text-secondary hover:text-feed-accent text-sm px-4 py-2 rounded-full transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
