import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Post } from '@doomschooling/shared';
import { highlightCode } from '@/lib/shiki';

interface PostBodyProps {
  post: Post;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-feed-text">{children}</strong>,
  em: ({ children }) => <em className="text-feed-text-secondary">{children}</em>,
  code: ({ children, className }) => {
    if (!className) {
      return (
        <code className="rounded bg-[#e5ece8] px-1.5 py-0.5 font-utility text-[13px] text-[#115e50]">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md border border-[#29332f] bg-[#18201d] p-4 font-utility text-sm text-[#e9f1ed]">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h1 className="mb-2 font-display text-xl font-bold text-feed-text">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 font-display text-lg font-bold text-feed-text">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 text-base font-bold text-feed-text">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 list-outside list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-outside list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-1 text-feed-text">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-semibold text-feed-accent underline decoration-feed-border underline-offset-2 hover:decoration-feed-accent"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-feed-gold pl-4 text-feed-text-secondary">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-md border border-feed-border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-feed-border bg-feed-bg px-3 py-2 font-bold">{children}</th>,
  td: ({ children }) => <td className="border-b border-feed-border px-3 py-2 last:border-b-0">{children}</td>,
};

function ShikiCodeBlock({ content, language }: { content: string; language: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    highlightCode(content, language).then(setHtml);
  }, [content, language]);

  if (!html) {
    return (
      <pre className="overflow-x-auto rounded-md border border-[#29332f] bg-[#18201d] p-4 font-utility text-sm text-[#cad7d1]">
        <code>{content}</code>
      </pre>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function PostBody({ post }: PostBodyProps) {
  if (post.postType === 'divider') {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-feed-border" />
        <span className="font-utility text-[11px] font-bold text-feed-accent">{post.content}</span>
        <div className="h-px flex-1 bg-feed-border" />
      </div>
    );
  }

  if (post.postType === 'code') {
    return (
      <div>
        {post.language && (
          <span className="mb-2 inline-block rounded bg-feed-bg px-2 py-1 font-utility text-[10px] font-semibold text-feed-text-muted">
            {post.language}
          </span>
        )}
        <ShikiCodeBlock content={post.content} language={post.language ?? 'text'} />
      </div>
    );
  }

  if (post.postType === 'image' && post.imageUrl) {
    return <ImagePost imageUrl={post.imageUrl} imageAlt={post.imageAlt ?? ''} content={post.content} />;
  }

  return (
    <div className="text-[15px] leading-7 text-feed-text sm:text-base">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {post.content}
      </Markdown>
    </div>
  );
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expanded educational image"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close image"
        title="Close image"
        autoFocus
      >
        <X aria-hidden="true" size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

function ImagePost({ imageUrl, imageAlt, content }: { imageUrl: string; imageAlt: string; content: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full overflow-hidden rounded-md border border-feed-border bg-feed-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent"
        aria-label="Expand educational image"
      >
        <img src={imageUrl} alt={imageAlt} className="max-h-[520px] w-full object-contain transition-opacity hover:opacity-90" />
      </button>
      <div className="text-[15px] leading-7 text-feed-text sm:text-base">
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </Markdown>
      </div>
      {lightboxOpen && <ImageLightbox src={imageUrl} alt={imageAlt} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
