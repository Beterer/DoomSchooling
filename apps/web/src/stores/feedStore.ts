import { create } from 'zustand';

interface FeedStore {
  collapsedThreads: Set<string>;
  toggleThread: (postId: string) => void;
  isCollapsed: (postId: string) => boolean;
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
}));
