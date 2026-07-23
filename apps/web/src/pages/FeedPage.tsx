import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { GeneratedFeed, Persona, Post } from '@doomschooling/shared';
import { EndOfFeed } from '@/components/feed/EndOfFeed';
import { Feed } from '@/components/feed/Feed';
import { LoadingFeed } from '@/components/ui/LoadingFeed';
import { continueFeed, generateFeed } from '@/lib/api';
import { DEPTH_OPTIONS, parseLearningDepth, type LearningDepth } from '@/lib/feed';

const MAX_GENERATION_ROUNDS = 5;

const ROLE_LABELS: Record<Persona['role'], string> = {
  expert: 'Expert',
  practitioner: 'Practitioner',
  learner: 'Learner',
  skeptic: 'Skeptic',
  enthusiast: 'Enthusiast',
};

interface FeedCache {
  posts: Post[];
  personas: Persona[];
  suggestedNextTopics: string[];
  feedId: string;
  topicTitle: string;
  generationRound: number;
}

function cacheKey(topic: string, depth: LearningDepth) {
  return `feed_cache:${depth}:${topic}`;
}

function loadCache(topic: string, depth: LearningDepth): FeedCache | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(topic, depth));
    return raw ? (JSON.parse(raw) as FeedCache) : null;
  } catch {
    return null;
  }
}

function saveCache(topic: string, depth: LearningDepth, data: FeedCache) {
  try {
    sessionStorage.setItem(cacheKey(topic, depth), JSON.stringify(data));
  } catch {
    // A full or unavailable sessionStorage should not block learning.
  }
}

export default function FeedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get('topic')?.trim() ?? '';
  const depth = parseLearningDepth(searchParams.get('depth'));

  const [posts, setPosts] = useState<Post[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [suggestedNextTopics, setSuggestedNextTopics] = useState<string[]>([]);
  const [feedId, setFeedId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [generationRound, setGenerationRound] = useState(0);
  const generationRoundRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const initialRequestKeyRef = useRef<string | null>(null);
  const hasReachedLimit = generationRound >= MAX_GENERATION_ROUNDS;

  const postsRef = useRef(posts);
  postsRef.current = posts;
  const personasRef = useRef(personas);
  personasRef.current = personas;
  const topicRef = useRef(topic);
  topicRef.current = topic;
  const depthRef = useRef(depth);
  depthRef.current = depth;

  const initialLoad = useMutation({
    mutationFn: generateFeed,
    onSuccess: (data: GeneratedFeed) => {
      setPosts(data.posts);
      setSuggestedNextTopics(data.suggestedNextTopics);
      setFeedId(data.id);
      setTopicTitle(data.topicTitle);
      setGenerationRound(1);
      generationRoundRef.current = 1;
      setPersonas(extractPersonas(data.posts));
    },
  });

  const loadMore = useMutation({
    mutationFn: continueFeed,
    onSuccess: (data) => {
      setPosts((previousPosts) => [...previousPosts, ...data.posts]);
      generationRoundRef.current += 1;
      setGenerationRound(generationRoundRef.current);
      isLoadingMore.current = false;
    },
    onError: () => {
      isLoadingMore.current = false;
    },
  });

  const loadMoreMutateRef = useRef(loadMore.mutate);
  loadMoreMutateRef.current = loadMore.mutate;

  useEffect(() => {
    if (!topic) {
      navigate('/', { replace: true });
      return;
    }

    const cached = loadCache(topic, depth);
    if (cached) {
      initialRequestKeyRef.current = cacheKey(topic, depth);
      setPosts(cached.posts);
      setPersonas(cached.personas);
      setSuggestedNextTopics(cached.suggestedNextTopics);
      setFeedId(cached.feedId);
      setTopicTitle(cached.topicTitle);
      setGenerationRound(cached.generationRound);
      generationRoundRef.current = cached.generationRound;
      return;
    }

    const requestKey = cacheKey(topic, depth);
    if (initialRequestKeyRef.current === requestKey) return;
    initialRequestKeyRef.current = requestKey;

    setPosts([]);
    setPersonas([]);
    setSuggestedNextTopics([]);
    setFeedId('');
    setTopicTitle('');
    setGenerationRound(0);
    generationRoundRef.current = 0;
    initialLoad.mutate({ topic, depth });
  }, [depth, topic]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (posts.length > 0 && feedId) {
      saveCache(topic, depth, {
        posts,
        personas,
        suggestedNextTopics,
        feedId,
        topicTitle,
        generationRound,
      });
    }
  }, [depth, feedId, generationRound, personas, posts, suggestedNextTopics, topic, topicTitle]);

  const handleLoadMore = useCallback(() => {
    if (
      isLoadingMore.current ||
      generationRoundRef.current >= MAX_GENERATION_ROUNDS ||
      postsRef.current.length === 0 ||
      personasRef.current.length === 0
    ) {
      return;
    }

    isLoadingMore.current = true;
    loadMoreMutateRef.current({
      topic: topicRef.current,
      depth: depthRef.current,
      personas: personasRef.current,
      lastPosts: postsRef.current.slice(-5),
      postIdCounter: postsRef.current.length + 1,
    });
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: '600px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  if (!topic) return null;

  const depthLabel = DEPTH_OPTIONS.find((option) => option.value === depth)?.label ?? 'Go further';

  return (
    <div className="min-h-screen bg-feed-bg">
      <header className="sticky top-16 z-20 border-b border-feed-border bg-feed-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1120px] items-center gap-3 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-feed-text-secondary transition-colors hover:border-feed-border hover:bg-white hover:text-feed-text"
            aria-label="Back to home"
            title="Back to home"
          >
            <ArrowLeft aria-hidden="true" size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-black tracking-[-0.035em] text-feed-text sm:text-2xl">
              {topicTitle || topic}
            </h1>
            <p className="mt-0.5 font-utility text-xs text-feed-text-muted">
              {posts.length > 0 ? `${posts.length} posts` : 'Preparing the discussion'} / {depthLabel}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1120px] items-start gap-8 px-0 py-0 lg:grid-cols-[240px_minmax(0,760px)] lg:px-6 lg:py-8">
        <aside className="sticky top-40 hidden lg:block">
          <div className="rounded-2xl border border-feed-border bg-white p-4 shadow-sm">
          <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">Discussion map</p>
          <div className="mt-3 rounded-xl bg-feed-bg p-3">
            <p className="text-sm font-bold text-feed-text">{depthLabel}</p>
            <p className="mt-1 text-sm leading-6 text-feed-text-secondary">
              Round {Math.max(generationRound, 1)} of {MAX_GENERATION_ROUNDS}
            </p>
          </div>

          {personas.length > 0 && (
            <div className="mt-5 border-t border-feed-border pt-4">
              <p className="font-utility text-[10px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">Who is speaking</p>
              <div className="mt-3 space-y-2">
                {personas.map((persona) => (
                  <div key={persona.id} className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-feed-bg">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                      style={{ backgroundColor: persona.avatarColor }}
                    >
                      {persona.avatarInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-feed-text">{persona.displayName}</p>
                      <p className="font-utility text-[9px] font-bold uppercase tracking-wide text-feed-text-muted">{ROLE_LABELS[persona.role]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden border-x border-feed-border bg-feed-card shadow-[0_20px_60px_rgba(38,53,90,0.08)] lg:rounded-2xl lg:border">
          {personas.length > 0 && (
            <div className="border-b border-feed-border bg-feed-bg/70 px-4 py-3 lg:hidden">
              <p className="font-utility text-[9px] font-bold uppercase tracking-[0.14em] text-feed-text-muted">
                Who is speaking
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-feed-border bg-white py-1.5 pl-1.5 pr-3"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-black text-white"
                      style={{ backgroundColor: persona.avatarColor }}
                    >
                      {persona.avatarInitials}
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold leading-tight text-feed-text">{persona.displayName}</span>
                      <span className="block font-utility text-[8px] font-bold uppercase tracking-wide text-feed-text-muted">
                        {ROLE_LABELS[persona.role]}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {initialLoad.isPending && <LoadingFeed topic={topic} />}

          {initialLoad.isError && (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-display text-xl font-bold text-red-900">The feed could not be generated</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
                {initialLoad.error.message}
              </p>
              <button
                type="button"
                onClick={() => initialLoad.mutate({ topic, depth })}
                className="mx-auto mt-5 flex h-10 items-center gap-2 rounded-md bg-feed-text px-4 text-sm font-bold text-white transition-colors hover:bg-feed-accent"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Try again
              </button>
            </div>
          )}

          {posts.length > 0 && (
            <Feed
              feed={{ id: feedId, topic, topicTitle, posts, suggestedNextTopics, generatedAt: '' }}
              depth={depth}
              hideNextTopics
            />
          )}

          {hasReachedLimit ? (
            posts.length > 0 && <EndOfFeed topics={suggestedNextTopics} depth={depth} />
          ) : (
            <>
              <div ref={sentinelRef} className="h-px" />

              {loadMore.isPending && <LoadingFeed compact topic={topic} />}

              {loadMore.isError && (
                <div className="border-t border-feed-border p-5 text-center">
                  <p className="text-sm text-feed-text-secondary">The discussion paused before the next round.</p>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="mx-auto mt-3 flex h-9 items-center gap-2 rounded-md border border-feed-border px-3 text-sm font-semibold text-feed-text transition-colors hover:bg-feed-card-hover"
                  >
                    <RefreshCw aria-hidden="true" size={15} />
                    Continue
                  </button>
                </div>
              )}

              {posts.length > 0 && !loadMore.isPending && !loadMore.isError && (
                <Feed
                  feed={{ id: feedId, topic, topicTitle, posts: [], suggestedNextTopics, generatedAt: '' }}
                  depth={depth}
                  hidePostList
                />
              )}
            </>
          )}
        </section>
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
