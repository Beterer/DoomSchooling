import type { Persona, Post } from '@doomschooling/shared';
import type { LearningDepth } from '@/lib/feed';

const CACHE_PREFIX = 'doomschooling:feed-cache:v2:';
const SCROLL_PREFIX = 'doomschooling:feed-scroll:v2:';
const LEGACY_CACHE_PREFIX = 'feed_cache:';
const CACHE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHED_FEEDS = 8;

export interface FeedCache {
  posts: Post[];
  personas: Persona[];
  suggestedNextTopics: string[];
  feedId: string;
  topicTitle: string;
  generationRound: number;
}

interface StoredFeedCache extends FeedCache {
  cachedAt: number;
  lastAccessedAt: number;
}

function cacheSuffix(topic: string, depth: LearningDepth) {
  return encodeURIComponent(`${depth}:${topic.trim().toLocaleLowerCase()}`);
}

function cacheKey(topic: string, depth: LearningDepth) {
  return `${CACHE_PREFIX}${cacheSuffix(topic, depth)}`;
}

function scrollKey(topic: string, depth: LearningDepth) {
  return `${SCROLL_PREFIX}${cacheSuffix(topic, depth)}`;
}

function isFeedCache(value: unknown): value is FeedCache {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<FeedCache>;
  return (
    Array.isArray(candidate.posts) &&
    Array.isArray(candidate.personas) &&
    Array.isArray(candidate.suggestedNextTopics) &&
    typeof candidate.feedId === 'string' &&
    typeof candidate.topicTitle === 'string' &&
    typeof candidate.generationRound === 'number' &&
    Number.isFinite(candidate.generationRound)
  );
}

function isStoredFeedCache(value: unknown): value is StoredFeedCache {
  if (!isFeedCache(value)) return false;

  const candidate = value as Partial<StoredFeedCache>;
  return (
    typeof candidate.cachedAt === 'number' &&
    Number.isFinite(candidate.cachedAt) &&
    typeof candidate.lastAccessedAt === 'number' &&
    Number.isFinite(candidate.lastAccessedAt)
  );
}

function parseCache(raw: string | null): StoredFeedCache | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredFeedCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function removeCache(storage: Storage, key: string) {
  storage.removeItem(key);
  storage.removeItem(`${SCROLL_PREFIX}${key.slice(CACHE_PREFIX.length)}`);
}

function prunePersistentCaches() {
  const now = Date.now();
  const caches: Array<{ key: string; lastAccessedAt: number }> = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(CACHE_PREFIX)) continue;

    const cached = parseCache(localStorage.getItem(key));
    if (!cached || now - cached.cachedAt > CACHE_LIFETIME_MS) {
      removeCache(localStorage, key);
      index -= 1;
      continue;
    }

    caches.push({ key, lastAccessedAt: cached.lastAccessedAt });
  }

  caches
    .sort((left, right) => right.lastAccessedAt - left.lastAccessedAt)
    .slice(MAX_CACHED_FEEDS)
    .forEach(({ key }) => removeCache(localStorage, key));
}

function writePersistentCache(key: string, cache: StoredFeedCache): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(cache));
    prunePersistentCaches();
    return true;
  } catch {
    try {
      const oldestCacheKey = Array.from({ length: localStorage.length }, (_, index) =>
        localStorage.key(index),
      )
        .filter((candidate): candidate is string => Boolean(candidate?.startsWith(CACHE_PREFIX)))
        .map((candidate) => ({
          key: candidate,
          lastAccessedAt: parseCache(localStorage.getItem(candidate))?.lastAccessedAt ?? 0,
        }))
        .sort((left, right) => left.lastAccessedAt - right.lastAccessedAt)[0]?.key;

      if (!oldestCacheKey || oldestCacheKey === key) return false;

      removeCache(localStorage, oldestCacheKey);
      localStorage.setItem(key, JSON.stringify(cache));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadFeedCache(topic: string, depth: LearningDepth): FeedCache | null {
  const key = cacheKey(topic, depth);

  try {
    prunePersistentCaches();
    const cached = parseCache(localStorage.getItem(key));

    if (cached) {
      writePersistentCache(key, { ...cached, lastAccessedAt: Date.now() });
      return cached;
    }
  } catch {
    // Fall back to session storage when persistent storage is unavailable.
  }

  try {
    const cached = parseCache(sessionStorage.getItem(key));
    if (cached) return cached;

    const legacyRaw = sessionStorage.getItem(`${LEGACY_CACHE_PREFIX}${depth}:${topic}`);
    if (!legacyRaw) return null;

    const legacyValue: unknown = JSON.parse(legacyRaw);
    if (!isFeedCache(legacyValue)) return null;

    saveFeedCache(topic, depth, legacyValue);
    return legacyValue;
  } catch {
    return null;
  }
}

export function saveFeedCache(topic: string, depth: LearningDepth, data: FeedCache) {
  const now = Date.now();
  const storedCache: StoredFeedCache = {
    ...data,
    cachedAt: now,
    lastAccessedAt: now,
  };
  const key = cacheKey(topic, depth);

  if (writePersistentCache(key, storedCache)) {
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${LEGACY_CACHE_PREFIX}${depth}:${topic}`);
    } catch {
      // The persistent copy is enough.
    }
    return;
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(storedCache));
  } catch {
    // A full or unavailable cache should not block feed generation.
  }
}

export function loadFeedScrollPosition(topic: string, depth: LearningDepth): number {
  try {
    const savedPosition =
      localStorage.getItem(scrollKey(topic, depth)) ??
      sessionStorage.getItem(scrollKey(topic, depth));
    const position = Number(savedPosition);
    return Number.isFinite(position) && position > 0 ? position : 0;
  } catch {
    return 0;
  }
}

export function saveFeedScrollPosition(
  topic: string,
  depth: LearningDepth,
  position: number,
) {
  const key = scrollKey(topic, depth);
  const value = String(Math.max(0, Math.round(position)));

  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Losing scroll position is safe when storage is unavailable.
    }
  }
}
