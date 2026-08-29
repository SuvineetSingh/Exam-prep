'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchTagSuggestions } from '@/lib/supabase/queries/tagQueries';

interface TagChipInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  disabled?: boolean;
}

export function TagChipInput({ value, onChange, max, disabled }: TagChipInputProps) {
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const atMax = max !== undefined && value.length >= max;

  useEffect(() => {
    const term = draft.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await fetchTagSuggestions(term);
      if (!cancelled) setSuggestions(results);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft]);

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || atMax) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1]!);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-brand-green-dark text-xs font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              className="text-brand-green-dark/60 hover:text-brand-green-dark"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {!atMax && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a tag and press Enter…"
            className="input py-3"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100 overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-neutral-500 mt-1 ml-1">
        {max !== undefined ? `${value.length}/${max} tags` : `${value.length} tag${value.length === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}
