import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { Post } from '@doomschooling/shared';
import { highlightCode } from '@/lib/shiki';

interface PostBodyProps {
  post: Post;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-feed-text">{children}</strong>
  ),
  em: ({ children }) => <em className="text-feed-text-secondary">{children}</em>,
  code: ({ children, className }) => {
    if (!className) {
      return (
        <code className="bg-[#253341] text-emerald-300 px-1.5 py-0.5 rounded text-[13px] font-mono">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto text-sm font-mono mb-2 border border-feed-border">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="text-feed-text font-bold text-base mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-feed-text font-semibold text-[15px] mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-feed-text font-medium text-[15px] mb-1">{children}</h3>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-feed-text">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-feed-accent hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-feed-border pl-3 text-feed-text-secondary italic my-2">
      {children}
    </blockquote>
  ),
};

function ShikiCodeBlock({ content, language }: { content: string; language: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    highlightCode(content, language).then(setHtml);
  }, [content, language]);

  if (!html) {
    return (
      <pre className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto text-feed-text-secondary text-sm font-mono border border-feed-border">
        <code>{content}</code>
      </pre>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function PostBody({ post }: PostBodyProps) {
  if (post.postType === 'divider') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-feed-border" />
        <span className="text-feed-text-muted text-xs uppercase tracking-widest font-medium whitespace-nowrap">
          {post.content}
        </span>
        <div className="flex-1 h-px bg-feed-border" />
      </div>
    );
  }

  if (post.postType === 'code') {
    return (
      <div>
        {post.language && (
          <div className="mb-2">
            <span className="text-xs text-feed-text-muted bg-[#253341] px-2 py-0.5 rounded-md font-mono">
              {post.language}
            </span>
          </div>
        )}
        <ShikiCodeBlock content={post.content} language={post.language ?? 'bash'} />
      </div>
    );
  }

  if (post.postType === 'image' && post.imageUrl) {
    return (
      <div className="space-y-3">
        <img
          src={post.imageUrl}
          alt={post.imageAlt ?? ''}
          className="rounded-2xl max-w-full border border-feed-border"
        />
        <div className="text-feed-text text-[15px] leading-relaxed">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </Markdown>
        </div>
      </div>
    );
  }

  return (
    <div className="text-feed-text text-[15px] leading-normal">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {post.content}
      </Markdown>
    </div>
  );
}
