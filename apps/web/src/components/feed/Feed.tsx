import type { GeneratedFeed } from '@doomschooling/shared';
import { Post } from './Post';
import { NextTopics } from './NextTopics';

interface FeedProps {
  feed: GeneratedFeed;
  hideNextTopics?: boolean;
  hidePostList?: boolean;
}

export function Feed({ feed, hideNextTopics, hidePostList }: FeedProps) {
  return (
    <div>
      {!hidePostList && (
        <div>
          {feed.posts.map((post, index) => {
            const nextPost = feed.posts[index + 1];
            const isThreaded =
              nextPost !== undefined &&
              nextPost.depth > 0 &&
              post.depth < nextPost.depth;

            return <Post key={post.id} post={post} isThreaded={isThreaded} />;
          })}
        </div>
      )}

      {!hideNextTopics && feed.suggestedNextTopics.length > 0 && (
        <div className="mt-4">
          <NextTopics topics={feed.suggestedNextTopics} />
        </div>
      )}
    </div>
  );
}
