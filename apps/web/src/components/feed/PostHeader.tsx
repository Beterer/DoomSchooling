import type { Persona } from '@doomschooling/shared';

const ROLE_LABELS: Record<string, string> = {
  expert: 'Expert',
  practitioner: 'Practitioner',
  learner: 'Learner',
  skeptic: 'Skeptic',
  enthusiast: 'Enthusiast',
};

const ROLE_CLASSES: Record<string, string> = {
  expert: 'bg-indigo-900/60 text-indigo-300',
  practitioner: 'bg-cyan-900/60 text-cyan-300',
  learner: 'bg-green-900/60 text-green-300',
  skeptic: 'bg-red-900/60 text-red-300',
  enthusiast: 'bg-amber-900/60 text-amber-300',
};

interface PostHeaderProps {
  persona: Persona;
  timestamp: string;
}

export function PostHeader({ persona, timestamp }: PostHeaderProps) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
        style={{ backgroundColor: persona.avatarColor }}
      >
        {persona.avatarInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-100 text-sm">{persona.displayName}</span>
          <span className="text-zinc-500 text-sm">{persona.handle}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              ROLE_CLASSES[persona.role] ?? 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {ROLE_LABELS[persona.role] ?? persona.role}
          </span>
        </div>
      </div>

      <span className="text-zinc-500 text-xs flex-shrink-0 pt-0.5">{timestamp}</span>
    </div>
  );
}
