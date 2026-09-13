import { create } from 'zustand';

interface Comment {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
}

interface FeedStore {
  /** Keys are `${feedId}:${postId}`, since post ids repeat across feeds. */
  collapsedThreads: Set<string>;
  toggleThread: (threadKey: string) => void;
  isCollapsed: (threadKey: string) => boolean;

  upvotedPosts: Set<string>;
  toggleUpvote: (postId: string) => void;
  isUpvoted: (postId: string) => boolean;

  comments: Map<string, Comment[]>;
  addComment: (postId: string, text: string) => void;
  getComments: (postId: string) => Comment[];

  activeCommentPost: string | null;
  setActiveCommentPost: (postId: string | null) => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  collapsedThreads: new Set(),
  toggleThread: (threadKey: string) =>
    set((state) => {
      const next = new Set(state.collapsedThreads);
      if (next.has(threadKey)) {
        next.delete(threadKey);
      } else {
        next.add(threadKey);
      }
      return { collapsedThreads: next };
    }),
  isCollapsed: (threadKey: string) => get().collapsedThreads.has(threadKey),

  upvotedPosts: new Set(),
  toggleUpvote: (postId: string) =>
    set((state) => {
      const next = new Set(state.upvotedPosts);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return { upvotedPosts: next };
    }),
  isUpvoted: (postId: string) => get().upvotedPosts.has(postId),

  comments: new Map(),
  addComment: (postId: string, text: string) =>
    set((state) => {
      const next = new Map(state.comments);
      const existing = next.get(postId) ?? [];
      next.set(postId, [
        ...existing,
        {
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          postId,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { comments: next };
    }),
  getComments: (postId: string) => get().comments.get(postId) ?? [],

  activeCommentPost: null,
  setActiveCommentPost: (postId: string | null) => set({ activeCommentPost: postId }),
}));
