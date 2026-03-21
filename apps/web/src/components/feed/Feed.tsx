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
        <div className="space-y-2">
          {feed.posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      )}

      {!hideNextTopics && feed.suggestedNextTopics.length > 0 && (
        <div className="mt-8">
          <NextTopics topics={feed.suggestedNextTopics} />
        </div>
      )}
    </div>
  );
}
