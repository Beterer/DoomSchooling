import type { Post as PostType } from '@doomschooling/shared';
import { PostHeader } from './PostHeader';
import { PostBody } from './PostBody';
import { PostActions } from './PostActions';

interface PostProps {
  post: PostType;
  isThreaded?: boolean;
}

export function Post({ post, isThreaded }: PostProps) {
  if (post.postType === 'divider') {
    return (
      <div className="px-4 py-1 border-b border-feed-border">
        <PostBody post={post} />
      </div>
    );
  }

  const visualDepth = Math.min(post.depth, 3);

  return (
    <article
      className="px-4 pt-3 pb-1 border-b border-feed-border hover:bg-feed-card-hover/50 transition-colors cursor-pointer"
      style={{ paddingLeft: `${16 + visualDepth * 28}px` }}
    >
      <div className="flex gap-3">
        {/* Avatar column */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: post.persona.avatarColor }}
          >
            {post.persona.avatarInitials}
          </div>
          {isThreaded && (
            <div className="w-0.5 flex-1 bg-feed-border-light mt-1 min-h-[8px]" />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 pb-2">
          <PostHeader persona={post.persona} timestamp={post.timestamp} />
          <div className="mt-1">
            <PostBody post={post} />
          </div>
          <PostActions postId={post.id} votes={post.votes} />
        </div>
      </div>
    </article>
  );
}
