import type { Post as PostType } from '@doomschooling/shared';
import { PostActions } from './PostActions';
import { PostBody } from './PostBody';
import { PostHeader } from './PostHeader';

interface PostProps {
  post: PostType;
  isThreaded?: boolean;
}

const DEPTH_PADDING = [
  'ml-0',
  'ml-5 sm:ml-8',
  'ml-9 sm:ml-14',
  'ml-12 sm:ml-20',
] as const;

export function Post({ post, isThreaded }: PostProps) {
  if (post.postType === 'divider') {
    return (
      <div className="border-b border-feed-border px-4 py-2">
        <PostBody post={post} />
      </div>
    );
  }

  const visualDepth = Math.min(post.depth, 3);

  return (
    <article
      className={`persona-post border-b border-l-[3px] border-b-feed-border px-4 py-5 transition-colors sm:px-5 ${DEPTH_PADDING[visualDepth]}`}
      style={{ '--persona-color': post.persona.avatarColor } as React.CSSProperties}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex shrink-0 flex-col items-center">
          <div
            className="persona-ring flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white sm:h-11 sm:w-11 sm:text-sm"
            style={{ backgroundColor: post.persona.avatarColor }}
          >
            {post.persona.avatarInitials}
          </div>
          {isThreaded && <div className="mt-1 min-h-2 w-px flex-1 bg-feed-border" />}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <PostHeader persona={post.persona} timestamp={post.timestamp} />
          <div className="mt-2">
            <PostBody post={post} />
          </div>
          <PostActions postId={post.id} votes={post.votes} />
        </div>
      </div>
    </article>
  );
}
