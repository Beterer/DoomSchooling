import type { Post as PostType } from '@doomschooling/shared';
import { PostActions } from './PostActions';
import { PostBody } from './PostBody';
import { PostHeader } from './PostHeader';

interface PostProps {
  post: PostType;
  isReply?: boolean;
}

// Padding and avatar sizes here define where ThreadNode draws its thread line.
export function Post({ post, isReply = false }: PostProps) {
  if (post.postType === 'divider') {
    return (
      <div className="border-b border-feed-border px-4 py-2">
        <PostBody post={post} />
      </div>
    );
  }

  return (
    <article
      className={`persona-post border-l-[3px] py-5 pr-4 transition-colors sm:px-5 ${isReply ? 'pl-3' : 'pl-4'}`}
      style={{ '--persona-color': post.persona.avatarColor } as React.CSSProperties}
    >
      <div className="flex gap-3 sm:gap-4">
        <div
          className={`persona-ring flex shrink-0 items-center justify-center font-black text-white sm:h-11 sm:w-11 sm:rounded-xl sm:text-sm ${
            isReply ? 'h-8 w-8 rounded-lg text-[11px]' : 'h-10 w-10 rounded-xl text-xs'
          }`}
          style={{ backgroundColor: post.persona.avatarColor }}
        >
          {post.persona.avatarInitials}
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
