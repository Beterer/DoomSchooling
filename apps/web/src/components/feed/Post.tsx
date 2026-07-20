import type { Post as PostType } from '@doomschooling/shared';
import { PostActions } from './PostActions';
import { PostBody } from './PostBody';
import { PostHeader } from './PostHeader';

interface PostProps {
  post: PostType;
  isThreaded?: boolean;
}

const DEPTH_PADDING = [
  'pl-4',
  'pl-7 sm:pl-9',
  'pl-10 sm:pl-14',
  'pl-12 sm:pl-[4.75rem]',
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
      className={`border-b border-feed-border py-4 pr-4 transition-colors hover:bg-feed-card-hover/55 ${DEPTH_PADDING[visualDepth]}`}
    >
      <div className="flex gap-2.5 sm:gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm sm:h-10 sm:w-10 sm:text-sm"
            style={{ backgroundColor: post.persona.avatarColor }}
          >
            {post.persona.avatarInitials}
          </div>
          {isThreaded && <div className="mt-1 min-h-2 w-px flex-1 bg-feed-border" />}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <PostHeader persona={post.persona} timestamp={post.timestamp} />
          <div className="mt-1.5">
            <PostBody post={post} />
          </div>
          <PostActions postId={post.id} votes={post.votes} />
        </div>
      </div>
    </article>
  );
}
