import { useMemo } from 'react';
import type { GeneratedFeed } from '@doomschooling/shared';
import type { LearningDepth } from '@/lib/feed';
import { buildThreadTree } from '@/lib/thread';
import { NextTopics } from './NextTopics';
import { ThreadNode } from './ThreadNode';

interface FeedProps {
  feed: GeneratedFeed;
  depth: LearningDepth;
  hideNextTopics?: boolean;
  hidePostList?: boolean;
}

export function Feed({ feed, depth, hideNextTopics, hidePostList }: FeedProps) {
  const threads = useMemo(() => buildThreadTree(feed.posts), [feed.posts]);

  return (
    <div>
      {!hidePostList && (
        <div>
          {threads.map((node) => (
            <ThreadNode key={node.post.id} feedId={feed.id} node={node} level={0} />
          ))}
        </div>
      )}

      {!hideNextTopics && feed.suggestedNextTopics.length > 0 && (
        <NextTopics topics={feed.suggestedNextTopics} depth={depth} />
      )}
    </div>
  );
}
