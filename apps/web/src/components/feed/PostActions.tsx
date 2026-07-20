import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useFeedStore } from '@/stores/feedStore';

const emptyComments: never[] = [];

interface PostActionsProps {
  postId: string;
  votes: number;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function PostActions({ postId, votes }: PostActionsProps) {
  const generatedReplyCount = Math.floor(votes * 0.18);
  const isUpvoted = useFeedStore((state) => state.upvotedPosts.has(postId));
  const toggleUpvote = useFeedStore((state) => state.toggleUpvote);
  const activeCommentPost = useFeedStore((state) => state.activeCommentPost);
  const setActiveCommentPost = useFeedStore((state) => state.setActiveCommentPost);
  const addComment = useFeedStore((state) => state.addComment);
  const comments = useFeedStore((state) => state.comments.get(postId) ?? emptyComments);

  const [commentText, setCommentText] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isCommentOpen = activeCommentPost === postId;
  const displayVotes = isUpvoted ? votes + 1 : votes;
  const totalComments = generatedReplyCount + comments.length;

  useEffect(() => {
    if (isCommentOpen) inputRef.current?.focus();
  }, [isCommentOpen]);

  async function handleShare(event: React.MouseEvent) {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('copied');
    } catch {
      setShareStatus('failed');
    }

    window.setTimeout(() => setShareStatus('idle'), 2000);
  }

  function handleSubmitComment(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    addComment(postId, trimmed);
    setCommentText('');
    setActiveCommentPost(null);
  }

  return (
    <div className="mt-3">
      <div className="flex max-w-72 items-center justify-between -ml-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setActiveCommentPost(isCommentOpen ? null : postId);
          }}
          className={`group flex h-8 min-w-14 items-center gap-1 text-xs transition-colors ${
            isCommentOpen ? 'text-feed-accent' : 'text-feed-text-muted hover:text-feed-accent'
          }`}
          aria-label="Comment"
          title="Comment"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-feed-accent/10">
            <MessageCircle aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
          {totalComments > 0 && <span>{formatCount(totalComments)}</span>}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleUpvote(postId);
          }}
          className={`group flex h-8 min-w-14 items-center gap-1 text-xs transition-colors ${
            isUpvoted ? 'text-feed-signal' : 'text-feed-text-muted hover:text-feed-signal'
          }`}
          aria-label={isUpvoted ? 'Remove like' : 'Like'}
          title={isUpvoted ? 'Remove like' : 'Like'}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-feed-signal/10">
            <Heart aria-hidden="true" fill={isUpvoted ? 'currentColor' : 'none'} size={17} strokeWidth={1.8} />
          </span>
          {displayVotes > 0 && <span>{formatCount(displayVotes)}</span>}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full text-feed-text-muted transition-colors hover:bg-feed-accent/10 hover:text-feed-accent"
            aria-label="Copy feed link"
            title="Copy feed link"
          >
            <Share2 aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
          {shareStatus !== 'idle' && (
            <span
              role="status"
              className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-feed-text px-2.5 py-1 text-[11px] text-white shadow-md"
            >
              {shareStatus === 'copied' ? 'Link copied' : 'Copy failed'}
            </span>
          )}
        </div>
      </div>

      {isCommentOpen && (
        <form onSubmit={handleSubmitComment} onClick={(event) => event.stopPropagation()} className="mt-3">
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmitComment(event);
              }
            }}
            placeholder="Add your thought"
            rows={2}
            className="w-full resize-none rounded-md border border-feed-border bg-feed-bg px-3 py-2 text-sm text-feed-text placeholder:text-feed-text-muted focus:border-feed-accent focus:outline-none focus:ring-2 focus:ring-feed-accent/15"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveCommentPost(null)}
              className="h-8 px-3 text-xs font-semibold text-feed-text-muted transition-colors hover:text-feed-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="h-8 rounded-md bg-feed-accent px-3 text-xs font-bold text-white transition-colors hover:bg-feed-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comment
            </button>
          </div>
        </form>
      )}

      {comments.length > 0 && (
        <div className="mt-3 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-feed-border pl-3">
              <p className="text-sm leading-6 text-feed-text-secondary">{comment.text}</p>
              <span className="font-utility text-[10px] text-feed-text-muted">just now</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
