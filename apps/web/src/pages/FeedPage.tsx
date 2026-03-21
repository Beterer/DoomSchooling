import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGenerateFeed } from '@/hooks/useGenerateFeed';
import { Feed } from '@/components/feed/Feed';
import { LoadingFeed } from '@/components/ui/LoadingFeed';

export default function FeedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') ?? '';

  const { mutate, data, isPending, isError, error, reset } = useGenerateFeed();

  useEffect(() => {
    if (topic) {
      reset();
      mutate({ topic, depth: 'intermediate' });
    }
  }, [topic]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-lg leading-none"
            aria-label="Back to home"
          >
            ←
          </button>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Learning</p>
            <h1 className="text-zinc-100 font-semibold truncate">{topic}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {isPending && <LoadingFeed />}

        {isError && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-300 font-medium mb-2">Failed to generate feed</p>
            <p className="text-red-400 text-sm">{error.message}</p>
            <button
              onClick={() => mutate({ topic, depth: 'intermediate' })}
              className="mt-4 bg-red-800 hover:bg-red-700 text-red-100 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!isPending && data && <Feed feed={data} />}
      </main>
    </div>
  );
}
