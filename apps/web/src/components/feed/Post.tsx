import type { Post as PostType } from '@doomschooling/shared';
import { PostHeader } from './PostHeader';
import { PostBody } from './PostBody';
import { PostActions } from './PostActions';
import { ThreadLine } from './ThreadLine';

interface PostProps {
  post: PostType;
}

export function Post({ post }: PostProps) {
  if (post.postType === 'divider') {
    return (
      <div className="py-2 px-4">
        <PostBody post={post} />
      </div>
    );
  }

  return (
    <ThreadLine depth={post.depth}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
        <PostHeader persona={post.persona} timestamp={post.timestamp} />
        <PostBody post={post} />
        <PostActions votes={post.votes} />
      </div>
    </ThreadLine>
  );
}
