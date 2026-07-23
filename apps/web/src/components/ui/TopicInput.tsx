import { ArrowRight, MessageSquareText } from 'lucide-react';
import { DEPTH_OPTIONS, type LearningDepth } from '@/lib/feed';

interface TopicInputProps {
  value: string;
  depth: LearningDepth;
  onChange: (value: string) => void;
  onDepthChange: (depth: LearningDepth) => void;
  onSubmit: () => void;
}

export function TopicInput({ value, depth, onChange, onDepthChange, onSubmit }: TopicInputProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-[1.4rem] border border-feed-border bg-feed-card p-3 shadow-[0_20px_55px_rgba(52,87,213,0.10)] sm:p-4"
    >
      <label htmlFor="learning-topic" className="mb-2 block font-utility text-xs font-semibold text-feed-text-secondary">
        Topic or question
      </label>
      <div className="flex items-center gap-3 border-b border-feed-border pb-3">
        <MessageSquareText aria-hidden="true" className="hidden shrink-0 text-feed-accent sm:block" size={21} />
        <input
          id="learning-topic"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Why do empires collapse?"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base font-semibold text-feed-text placeholder:font-normal placeholder:text-feed-text-muted focus:outline-none sm:text-lg"
          autoFocus
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-feed-text px-4 text-sm font-bold text-white shadow-[3px_3px_0_#62d9ff] transition-all hover:-translate-y-0.5 hover:bg-feed-accent disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
        >
          <span className="hidden sm:inline">Build my feed</span>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-utility text-xs font-semibold text-feed-text-secondary">Learning depth</span>
        <div className="grid grid-cols-3 rounded-xl bg-feed-bg p-1" aria-label="Learning depth">
          {DEPTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDepthChange(option.value)}
              aria-pressed={depth === option.value}
              title={option.description}
              className={`min-h-9 rounded-lg px-2.5 text-xs font-semibold transition-all sm:px-3 ${
                depth === option.value
                  ? 'bg-white text-feed-accent shadow-sm ring-1 ring-feed-border'
                  : 'text-feed-text-muted hover:bg-feed-card-hover hover:text-feed-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
