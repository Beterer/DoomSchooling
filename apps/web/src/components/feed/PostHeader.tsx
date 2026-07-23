import type { Persona } from '@doomschooling/shared';

const ROLE_COLORS: Record<Persona['role'], string> = {
  expert: 'bg-[#e9edff] text-[#3457d5]',
  practitioner: 'bg-[#e6f6f2] text-[#008f7a]',
  learner: 'bg-[#fff5d9] text-[#9b6900]',
  skeptic: 'bg-[#fff0f0] text-[#d93d3d]',
  enthusiast: 'bg-[#f2ebfb] text-[#7b48b5]',
};

const ROLE_LABELS: Record<Persona['role'], string> = {
  expert: 'Expert',
  practitioner: 'Practitioner',
  learner: 'Learner',
  skeptic: 'Skeptic',
  enthusiast: 'Enthusiast',
};

interface PostHeaderProps {
  persona: Persona;
  timestamp: string;
}

export function PostHeader({ persona, timestamp }: PostHeaderProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="text-[15px] font-extrabold tracking-[-0.015em] text-feed-text sm:text-base">{persona.displayName}</span>
      <span className={`rounded-full px-2 py-0.5 font-utility text-[9px] font-bold uppercase tracking-[0.08em] ${ROLE_COLORS[persona.role]}`}>
        {ROLE_LABELS[persona.role]}
      </span>
      <span className="max-w-32 truncate text-xs text-feed-text-muted sm:max-w-none">{persona.handle}</span>
      <span aria-hidden="true" className="text-[10px] text-feed-border">•</span>
      <span className="text-xs text-feed-text-muted">{timestamp}</span>
    </div>
  );
}
