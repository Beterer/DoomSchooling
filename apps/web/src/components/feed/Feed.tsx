import type { GeneratedFeed } from '@doomschooling/shared';
import type { LearningDepth } from '@/lib/feed';
import { NextTopics } from './NextTopics';
import { Post } from './Post';

interface FeedProps {
  feed: GeneratedFeed;
  depth: LearningDepth;
  hideNextTopics?: boolean;
  hidePostList?: boolean;
}

export function Feed({ feed, depth, hideNextTopics, hidePostList }: FeedProps) {
  return (
    <div>
      {!hidePostList && (
        <div>
          {feed.posts.map((post, index) => {
            const nextPost = feed.posts[index + 1];
            const isThreaded =
              nextPost !== undefined && nextPost.depth > 0 && post.depth < nextPost.depth;

            return <Post key={post.id} post={post} isThreaded={isThreaded} />;
          })}
        </div>
      )}

      {!hideNextTopics && feed.suggestedNextTopics.length > 0 && (
        <NextTopics topics={feed.suggestedNextTopics} depth={depth} />
      )}
    </div>
  );
}
