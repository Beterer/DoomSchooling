import { useRef } from 'react';
import type { Post as PostType } from '@doomschooling/shared';
import { Plus } from 'lucide-react';
import { countReplies, type ThreadNode as ThreadNodeData } from '@/lib/thread';
import { useFeedStore } from '@/stores/feedStore';
import { Post } from './Post';

interface ThreadNodeProps {
  feedId: string;
  node: ThreadNodeData;
  level: number;
}

// Replies nested deeper than this sit flush with their parent instead of indenting further.
const MAX_INDENT_LEVEL = 3;

// Offsets follow Post's padding and avatar sizes so the line drops from the avatar's centre and
// the replies clear it. Mobile: top-level posts have 16px padding and a 40px avatar, replies 12px
// and 32px. From `sm` both use 20px padding and a 44px avatar. All sit behind a 3px left border.
const THREAD_GEOMETRY = {
  root: {
    line: 'left-[34px] top-[66px] w-2.5 sm:left-[37px] sm:top-[70px] sm:w-4',
    replies: 'pl-11 sm:pl-14',
  },
  reply: {
    line: 'left-[26px] top-[58px] w-2.5 sm:left-[37px] sm:top-[70px] sm:w-4',
    replies: 'pl-9 sm:pl-14',
  },
} as const;

function formatReplyCount(count: number) {
  return `${count} ${count === 1 ? 'reply' : 'replies'}`;
}

export function ThreadNode({ feedId, node, level }: ThreadNodeProps) {
  const { post, children } = node;
  const threadKey = `${feedId}:${post.id}`;
  const isCollapsed = useFeedStore((state) => state.collapsedThreads.has(threadKey));
  const toggleThread = useFeedStore((state) => state.toggleThread);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const isRoot = level === 0;
  // scroll-mt clears the sticky site and feed headers when a collapsed thread is scrolled back into view.
  const wrapperClassName = `relative scroll-mt-40 ${isRoot && post.postType !== 'divider' ? 'border-b border-feed-border' : ''}`;

  if (children.length === 0) {
    return (
      <div className={wrapperClassName}>
        <Post post={post} isReply={!isRoot} />
      </div>
    );
  }

  const replyCount = countReplies(node);
  const toggle = () => toggleThread(threadKey);
  const collapse = () => {
    toggleThread(threadKey);
    // The line can be clicked far below the parent, so keep the collapsed row on screen.
    requestAnimationFrame(() => wrapperRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  if (isCollapsed) {
    return (
      <div ref={wrapperRef} className={wrapperClassName}>
        <CollapsedThread post={post} replyCount={replyCount} isReply={!isRoot} onExpand={toggle} />
      </div>
    );
  }

  const canIndent = level < MAX_INDENT_LEVEL;
  const geometry = isRoot ? THREAD_GEOMETRY.root : THREAD_GEOMETRY.reply;

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      <Post post={post} isReply={!isRoot} />

      <div className={canIndent ? geometry.replies : ''}>
        {children.map((child) => (
          <ThreadNode
            key={child.post.id}
            feedId={feedId}
            node={child}
            level={canIndent ? level + 1 : level}
          />
        ))}
      </div>

      {canIndent && (
        <button
          type="button"
          onClick={collapse}
          aria-expanded="true"
          aria-label={`Collapse thread from ${post.persona.displayName}, ${formatReplyCount(replyCount)}`}
          title="Collapse thread"
          className={`group absolute bottom-5 flex cursor-pointer justify-center focus-visible:outline-none ${geometry.line}`}
        >
          <span className="h-full w-px rounded-full bg-feed-border transition-colors group-hover:w-0.5 group-hover:bg-feed-accent group-focus-visible:w-0.5 group-focus-visible:bg-feed-accent" />
        </button>
      )}
    </div>
  );
}

interface CollapsedThreadProps {
  post: PostType;
  replyCount: number;
  isReply: boolean;
  onExpand: () => void;
}

function CollapsedThread({ post, replyCount, isReply, onExpand }: CollapsedThreadProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-expanded="false"
      aria-label={`Expand thread from ${post.persona.displayName}, ${formatReplyCount(replyCount)} hidden`}
      className={`persona-post flex w-full min-w-0 items-center gap-2.5 border-l-[3px] py-3 pr-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-feed-accent sm:px-5 ${
        isReply ? 'pl-3' : 'pl-4'
      }`}
      style={{ '--persona-color': post.persona.avatarColor } as React.CSSProperties}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-feed-border text-feed-text-muted">
        <Plus aria-hidden="true" size={12} strokeWidth={2.5} />
      </span>
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-black text-white"
        style={{ backgroundColor: post.persona.avatarColor }}
      >
        {post.persona.avatarInitials}
      </span>
      <span className="min-w-0 truncate text-sm font-bold text-feed-text">{post.persona.displayName}</span>
      <span aria-hidden="true" className="text-[10px] text-feed-text-muted">•</span>
      <span className="shrink-0 text-xs text-feed-text-muted">{post.timestamp}</span>
      <span aria-hidden="true" className="text-[10px] text-feed-text-muted">•</span>
      <span className="shrink-0 font-utility text-[11px] font-semibold text-feed-accent">
        {formatReplyCount(replyCount)}
      </span>
    </button>
  );
}
