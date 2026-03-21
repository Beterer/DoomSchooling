import { useState, useRef, useEffect } from 'react';
import { useFeedStore } from '@/stores/feedStore';

const emptyComments: never[] = [];

interface PostActionsProps {
  postId: string;
  votes: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function PostActions({ postId, votes }: PostActionsProps) {
  const replyCount = Math.floor(votes * 0.3);
  const retweetCount = Math.floor(votes * 0.15);

  const isUpvoted = useFeedStore((s) => s.upvotedPosts.has(postId));
  const toggleUpvote = useFeedStore((s) => s.toggleUpvote);
  const activeCommentPost = useFeedStore((s) => s.activeCommentPost);
  const setActiveCommentPost = useFeedStore((s) => s.setActiveCommentPost);
  const addComment = useFeedStore((s) => s.addComment);
  const comments = useFeedStore((s) => s.comments.get(postId) ?? emptyComments);

  const [commentText, setCommentText] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isCommentOpen = activeCommentPost === postId;
  const displayVotes = isUpvoted ? votes + 1 : votes;
  const totalComments = replyCount + comments.length;

  useEffect(() => {
    if (isCommentOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommentOpen]);

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addComment(postId, trimmed);
    setCommentText('');
    setActiveCommentPost(null);
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between max-w-[425px] -ml-2">
        {/* Reply / Comment */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveCommentPost(isCommentOpen ? null : postId);
          }}
          className={`group flex items-center gap-1 transition-colors ${
            isCommentOpen ? 'text-sky-400' : 'text-feed-text-muted hover:text-sky-400'
          }`}
        >
          <div className="p-2 rounded-full group-hover:bg-sky-400/10 transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="text-[13px]">{totalComments > 0 ? formatCount(totalComments) : ''}</span>
        </button>

        {/* Retweet / Boost (cosmetic) */}
        <button className="group flex items-center gap-1 text-feed-text-muted hover:text-emerald-400 transition-colors">
          <div className="p-2 rounded-full group-hover:bg-emerald-400/10 transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-[13px]">{retweetCount > 0 ? formatCount(retweetCount) : ''}</span>
        </button>

        {/* Like / Upvote */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleUpvote(postId);
          }}
          className={`group flex items-center gap-1 transition-colors ${
            isUpvoted ? 'text-rose-400' : 'text-feed-text-muted hover:text-rose-400'
          }`}
        >
          <div className="p-2 rounded-full group-hover:bg-rose-400/10 transition-colors">
            <svg
              className="w-[18px] h-[18px]"
              fill={isUpvoted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-[13px]">{displayVotes > 0 ? formatCount(displayVotes) : ''}</span>
        </button>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="group flex items-center text-feed-text-muted hover:text-feed-accent transition-colors"
          >
            <div className="p-2 rounded-full group-hover:bg-feed-accent/10 transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </button>
          {shareToast && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-feed-accent text-white text-xs rounded-full whitespace-nowrap shadow-lg">
              Link copied!
            </div>
          )}
        </div>
      </div>

      {/* Comment input */}
      {isCommentOpen && (
        <form onSubmit={handleSubmitComment} onClick={(e) => e.stopPropagation()} className="mt-2 ml-0">
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment(e);
              }
            }}
            placeholder="Add a comment..."
            rows={2}
            className="w-full bg-feed-bg border border-feed-border rounded-lg px-3 py-2 text-sm text-feed-text-primary placeholder:text-feed-text-muted focus:outline-none focus:border-feed-accent resize-none"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setActiveCommentPost(null)}
              className="px-3 py-1 text-xs text-feed-text-muted hover:text-feed-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3 py-1 text-xs bg-feed-accent text-white rounded-full disabled:opacity-40 hover:bg-feed-accent/80 transition-colors"
            >
              Reply
            </button>
          </div>
        </form>
      )}

      {/* Rendered comments */}
      {comments.length > 0 && (
        <div className="mt-2 space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="pl-3 border-l-2 border-feed-border-light">
              <p className="text-sm text-feed-text-secondary">{comment.text}</p>
              <span className="text-xs text-feed-text-muted">just now</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
