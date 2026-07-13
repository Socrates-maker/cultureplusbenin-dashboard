import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { useTagOptions } from '@/lib/crud';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

/** Backend limits: max 20 tags of 30 characters each. */
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;

/** Mirrors the backend normalization (trim + lowercase). */
function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
}

interface Props {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** REST base path of the resource whose `/tags` route feeds autocomplete. */
  tagSource?: string;
}

/**
 * Chips input for free-form tags: type then Enter (or comma) to add, click
 * the cross to remove. Existing tags of the resource are suggested via a
 * native datalist when `tagSource` is provided.
 */
export function TagsInput({ id, value, onChange, placeholder, tagSource }: Props) {
  const [draft, setDraft] = useState('');
  const listId = useId();
  const { data: suggestions } = useTagOptions(tagSource);

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    setDraft('');
    if (!tag || value.includes(tag) || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Retirer le tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={id}
        list={listId}
        value={draft}
        maxLength={MAX_TAG_LENGTH}
        disabled={value.length >= MAX_TAGS}
        placeholder={
          value.length >= MAX_TAGS
            ? `Maximum ${MAX_TAGS} tags`
            : (placeholder ?? 'Ajouter un tag puis Entrée…')
        }
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(draft);
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            removeTag(value[value.length - 1]);
          }
        }}
        onBlur={() => draft.trim() && addTag(draft)}
      />
      <datalist id={listId}>
        {(suggestions ?? [])
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
