import type { ReactNode } from 'react';

interface ThreadLineProps {
  depth: number;
  children: ReactNode;
}

const LINE_COLORS = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
];

export function ThreadLine({ depth, children }: ThreadLineProps) {
  const visualDepth = Math.min(depth, 3);

  if (visualDepth === 0) {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length: visualDepth }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
        />
      ))}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
