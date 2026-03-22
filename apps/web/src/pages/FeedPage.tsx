import { useEffect, useRef, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { GeneratedFeed, Post, Persona } from '@doomschooling/shared';
import { generateFeed, continueFeed } from '@/lib/api';
import { Feed } from '@/components/feed/Feed';
import { EndOfFeed } from '@/components/feed/EndOfFeed';
import { LoadingFeed } from '@/components/ui/LoadingFeed';

const MAX_GENERATION_ROUNDS = 10;

interface FeedCache {
  posts: Post[];
  personas: Persona[];
  suggestedNextTopics: string[];
  feedId: string;
  topicTitle: string;
  generationRound: number;
}

function cacheKey(topic: string) {
  return `feed_cache:${topic}`;
}

function loadCache(topic: string): FeedCache | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(topic));
    return raw ? (JSON.parse(raw) as FeedCache) : null;
  } catch {
    return null;
  }
}

function saveCache(topic: string, data: FeedCache) {
  try {
    sessionStorage.setItem(cacheKey(topic), JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export default function FeedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic') ?? '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [suggestedNextTopics, setSuggestedNextTopics] = useState<string[]>([]);
  const [feedId, setFeedId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [generationRound, setGenerationRound] = useState(0);
  const generationRoundRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const hasReachedLimit = generationRound >= MAX_GENERATION_ROUNDS;

  // Stable refs for values used in the scroll callback to avoid observer churn
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const personasRef = useRef(personas);
  personasRef.current = personas;
  const topicRef = useRef(topic);
  topicRef.current = topic;

  const initialLoad = useMutation({
    mutationFn: generateFeed,
    onSuccess: (data: GeneratedFeed) => {
      setPosts(data.posts);
      setSuggestedNextTopics(data.suggestedNextTopics);
      setFeedId(data.id);
      setTopicTitle(data.topicTitle);
      setGenerationRound(1);
      generationRoundRef.current = 1;
      const uniquePersonas = extractPersonas(data.posts);
      setPersonas(uniquePersonas);
    },
  });

  const loadMore = useMutation({
    mutationFn: continueFeed,
    onSuccess: (data) => {
      setPosts((prev) => [...prev, ...data.posts]);
      generationRoundRef.current += 1;
      setGenerationRound(generationRoundRef.current);
      isLoadingMore.current = false;
    },
    onError: () => {
      isLoadingMore.current = false;
    },
  });

  // Stable ref so handleLoadMore doesn't depend on the mutation object
  const loadMoreMutateRef = useRef(loadMore.mutate);
  loadMoreMutateRef.current = loadMore.mutate;

  useEffect(() => {
    if (!topic) return;

    const cached = loadCache(topic);
    if (cached) {
      setPosts(cached.posts);
      setPersonas(cached.personas);
      setSuggestedNextTopics(cached.suggestedNextTopics);
      setFeedId(cached.feedId);
      setTopicTitle(cached.topicTitle);
      setGenerationRound(cached.generationRound);
      generationRoundRef.current = cached.generationRound;
      return;
    }

    setPosts([]);
    setPersonas([]);
    setSuggestedNextTopics([]);
    setFeedId('');
    setTopicTitle('');
    setGenerationRound(0);
    generationRoundRef.current = 0;
    initialLoad.mutate({ topic, depth: 'intermediate' });
  }, [topic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist feed state to sessionStorage so a background-evicted page reload
  // (common on iOS) restores content without re-hitting the API.
  useEffect(() => {
    if (posts.length > 0 && feedId) {
      saveCache(topic, { posts, personas, suggestedNextTopics, feedId, topicTitle, generationRound });
    }
  }, [posts, personas, suggestedNextTopics, feedId, topicTitle, generationRound, topic]);

  const handleLoadMore = useCallback(() => {
    if (
      isLoadingMore.current ||
      generationRoundRef.current >= MAX_GENERATION_ROUNDS ||
      postsRef.current.length === 0 ||
      personasRef.current.length === 0
    ) return;
    isLoadingMore.current = true;
    loadMoreMutateRef.current({
      topic: topicRef.current,
      depth: 'intermediate',
      personas: personasRef.current,
      lastPosts: postsRef.current.slice(-3),
      postIdCounter: postsRef.current.length + 1,
    });
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

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
  }, [handleLoadMore]);

  if (!topic) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-feed-bg">
      {/* Header */}
      <header className="sticky top-[53px] z-10 bg-feed-bg/80 backdrop-blur-md border-b border-feed-border">
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
            <h1 className="text-feed-text font-bold text-xl leading-tight truncate">{topicTitle || topic}</h1>
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
            feed={{ id: feedId, topic, topicTitle, posts, suggestedNextTopics, generatedAt: '' }}
            hideNextTopics
          />
        )}

        {hasReachedLimit ? (
          posts.length > 0 && (
            <EndOfFeed topics={suggestedNextTopics} />
          )
        ) : (
          <>
            <div ref={sentinelRef} />

            {loadMore.isPending && (
              <div>
                <LoadingFeed />
              </div>
            )}

            {posts.length > 0 && !loadMore.isPending && (
              <Feed
                feed={{ id: feedId, topic, topicTitle, posts: [], suggestedNextTopics, generatedAt: '' }}
                hidePostList
              />
            )}
          </>
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
