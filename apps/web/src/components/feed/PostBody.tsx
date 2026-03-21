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
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-zinc-300">{children}</em>,
  code: ({ children, className }) => {
    if (!className) {
      return (
        <code className="bg-zinc-800 text-emerald-300 px-1 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-zinc-950 rounded-lg p-4 overflow-x-auto text-sm font-mono mb-2">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="text-zinc-100 font-bold text-base mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-zinc-100 font-semibold text-sm mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-zinc-200 font-medium text-sm mb-1">{children}</h3>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-zinc-300">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-indigo-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-zinc-600 pl-3 text-zinc-400 italic my-2">
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
      <pre className="bg-zinc-950 rounded-lg p-4 overflow-x-auto text-zinc-300 text-sm font-mono">
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
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-500 text-xs uppercase tracking-widest font-medium whitespace-nowrap">
          {post.content}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    );
  }

  if (post.postType === 'code') {
    return (
      <div>
        {post.language && (
          <div className="mb-2">
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded font-mono">
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
          className="rounded-lg max-w-full border border-zinc-800"
        />
        <div className="text-zinc-300 text-sm leading-relaxed">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </Markdown>
        </div>
      </div>
    );
  }

  return (
    <div className="text-zinc-300 text-sm leading-relaxed">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {post.content}
      </Markdown>
    </div>
  );
}
