import type { Persona } from '@doomschooling/shared';

const ROLE_COLORS: Record<string, string> = {
  expert: 'text-indigo-400',
  practitioner: 'text-cyan-400',
  learner: 'text-emerald-400',
  skeptic: 'text-rose-400',
  enthusiast: 'text-amber-400',
};

const ROLE_LABELS: Record<string, string> = {
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
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-bold text-feed-text text-[15px]">{persona.displayName}</span>
      <span className={`text-xs ${ROLE_COLORS[persona.role] ?? 'text-feed-text-muted'}`}>
        {ROLE_LABELS[persona.role] ?? persona.role}
      </span>
      <span className="text-feed-text-muted text-[15px]">{persona.handle}</span>
      <span className="text-feed-text-muted text-[15px]">·</span>
      <span className="text-feed-text-muted text-[15px] hover:underline cursor-pointer">{timestamp}</span>
    </div>
  );
}
