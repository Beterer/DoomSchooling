interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TopicInput({ value, onChange, onSubmit }: TopicInputProps) {
  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="What do you want to learn?"
        className="flex-1 bg-feed-card border border-feed-border rounded-full px-5 py-3 text-feed-text placeholder-feed-text-muted focus:outline-none focus:border-feed-accent focus:ring-1 focus:ring-feed-accent/50 transition-all text-[15px]"
        autoFocus
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim()}
        className="bg-feed-accent hover:bg-feed-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-full font-bold transition-all text-[15px]"
      >
        Go
      </button>
    </div>
  );
}
