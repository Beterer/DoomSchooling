interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TopicInput({ value, onChange, onSubmit }: TopicInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="What do you want to learn today?"
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        autoFocus
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        Go
      </button>
    </div>
  );
}
