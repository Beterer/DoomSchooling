import type { GeneratedFeed } from '@doomschooling/shared';
import { Post } from './Post';
import { NextTopics } from './NextTopics';

interface FeedProps {
  feed: GeneratedFeed;
}

export function Feed({ feed }: FeedProps) {
  return (
    <div>
      <div className="space-y-2">
        {feed.posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>

      <div className="mt-8">
        <NextTopics topics={feed.suggestedNextTopics} />
      </div>
    </div>
  );
}
