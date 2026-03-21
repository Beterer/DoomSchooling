import { useEffect, useRef, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { GeneratedFeed, Post, Persona } from '@doomschooling/shared';
import { generateFeed, continueFeed } from '@/lib/api';
import { Feed } from '@/components/feed/Feed';
import { LoadingFeed } from '@/components/ui/LoadingFeed';

export default function FeedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') ?? '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [suggestedNextTopics, setSuggestedNextTopics] = useState<string[]>([]);
  const [feedId, setFeedId] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  const initialLoad = useMutation({
    mutationFn: generateFeed,
    onSuccess: (data: GeneratedFeed) => {
      setPosts(data.posts);
      setSuggestedNextTopics(data.suggestedNextTopics);
      setFeedId(data.id);
      const uniquePersonas = extractPersonas(data.posts);
      setPersonas(uniquePersonas);
    },
  });

  const loadMore = useMutation({
    mutationFn: continueFeed,
    onSuccess: (data) => {
      setPosts((prev) => [...prev, ...data.posts]);
      isLoadingMore.current = false;
    },
    onError: () => {
      isLoadingMore.current = false;
    },
  });

  useEffect(() => {
    if (topic) {
      setPosts([]);
      setPersonas([]);
      setSuggestedNextTopics([]);
      setFeedId('');
      initialLoad.mutate({ topic, depth: 'intermediate' });
    }
  }, [topic]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore.current || loadMore.isPending || posts.length === 0 || personas.length === 0) return;
    isLoadingMore.current = true;
    loadMore.mutate({
      topic,
      depth: 'intermediate',
      personas,
      lastPosts: posts.slice(-3),
      postIdCounter: posts.length + 1,
    });
  }, [topic, personas, posts, loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '1500px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, posts.length]);

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
        {initialLoad.isPending && <LoadingFeed />}

        {initialLoad.isError && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-300 font-medium mb-2">Failed to generate feed</p>
            <p className="text-red-400 text-sm">{initialLoad.error.message}</p>
            <button
              onClick={() => initialLoad.mutate({ topic, depth: 'intermediate' })}
              className="mt-4 bg-red-800 hover:bg-red-700 text-red-100 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {posts.length > 0 && (
          <Feed
            feed={{ id: feedId, topic, posts, suggestedNextTopics, generatedAt: '' }}
            hideNextTopics
          />
        )}

        <div ref={sentinelRef} />

        {loadMore.isPending && (
          <div className="py-6">
            <LoadingFeed />
          </div>
        )}

        {posts.length > 0 && !loadMore.isPending && (
          <div className="mt-8">
            <Feed
              feed={{ id: feedId, topic, posts: [], suggestedNextTopics, generatedAt: '' }}
              hidePostList
            />
          </div>
        )}
      </main>
    </div>
  );
}

function extractPersonas(posts: Post[]): Persona[] {
  const seen = new Set<string>();
  const result: Persona[] = [];
  for (const post of posts) {
    if (!seen.has(post.persona.id)) {
      seen.add(post.persona.id);
      result.push(post.persona);
    }
  }
  return result;
}
