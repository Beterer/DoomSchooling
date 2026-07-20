import type { Persona } from '@doomschooling/shared';

const ROLE_COLORS: Record<Persona['role'], string> = {
  expert: 'bg-[#3b6fb6]',
  practitioner: 'bg-[#177d72]',
  learner: 'bg-[#b98916]',
  skeptic: 'bg-feed-signal',
  enthusiast: 'bg-[#7b5aa6]',
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
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-[14px] font-bold text-feed-text sm:text-[15px]">{persona.displayName}</span>
      <span className="flex items-center gap-1 font-utility text-[10px] font-semibold text-feed-text-secondary">
        <span className={`h-1.5 w-1.5 rounded-full ${ROLE_COLORS[persona.role]}`} />
        {ROLE_LABELS[persona.role]}
      </span>
      <span className="max-w-32 truncate text-[13px] text-feed-text-muted sm:max-w-none">{persona.handle}</span>
      <span aria-hidden="true" className="text-xs text-feed-text-muted">/</span>
      <span className="text-[13px] text-feed-text-muted">{timestamp}</span>
    </div>
  );
}
