import { create } from 'zustand';

interface Comment {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
}

interface FeedStore {
  collapsedThreads: Set<string>;
  toggleThread: (postId: string) => void;
  isCollapsed: (postId: string) => boolean;

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
  toggleThread: (postId: string) =>
    set((state) => {
      const next = new Set(state.collapsedThreads);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return { collapsedThreads: next };
    }),
  isCollapsed: (postId: string) => get().collapsedThreads.has(postId),

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
