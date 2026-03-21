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
    <div className="min-h-screen bg-feed-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-feed-bg/80 backdrop-blur-md border-b border-feed-border">
        <div className="max-w-[600px] mx-auto flex items-center gap-4 px-4 h-[53px]">
          <button
            onClick={() => navigate('/')}
            className="text-feed-text hover:bg-feed-card-hover p-2 -ml-2 rounded-full transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-feed-text font-bold text-xl leading-tight truncate">{topic}</h1>
            <p className="text-feed-text-muted text-[13px]">
              {posts.length > 0 ? `${posts.length} posts` : 'Generating...'}
            </p>
          </div>
        </div>
      </header>

      {/* Feed content */}
      <main className="max-w-[600px] mx-auto">
        {initialLoad.isPending && <LoadingFeed />}

        {initialLoad.isError && (
          <div className="m-4 bg-rose-950/50 border border-rose-800/50 rounded-2xl p-6 text-center">
            <p className="text-rose-300 font-medium mb-2">Failed to generate feed</p>
            <p className="text-rose-400/80 text-sm mb-4">{initialLoad.error.message}</p>
            <button
              onClick={() => initialLoad.mutate({ topic, depth: 'intermediate' })}
              className="bg-feed-accent hover:bg-feed-accent-hover text-white px-5 py-2 rounded-full text-sm font-bold transition-colors"
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
          <div>
            <LoadingFeed />
          </div>
        )}

        {posts.length > 0 && !loadMore.isPending && (
          <Feed
            feed={{ id: feedId, topic, posts: [], suggestedNextTopics, generatedAt: '' }}
            hidePostList
          />
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
