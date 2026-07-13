import { Tag, X } from 'lucide-react';
import { useTagOptions } from '@/lib/crud';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  /** REST base path of the resource (its `/tags` route feeds the picker). */
  path: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

/**
 * Multi-select tag picker for list filters. Selected tags are sent as the
 * comma-separated `tags` query param (documents matching at least one tag).
 * Hidden while the resource has no tags at all.
 */
export function TagFilter({ path, value, onChange }: Props) {
  const { data: tags = [] } = useTagOptions(path);

  if (tags.length === 0 && value.length === 0) return null;

  const toggle = (tag: string) =>
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag],
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Tag /> Tags
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {value.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuLabel>Filtrer par tag</DropdownMenuLabel>
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag}
            checked={value.includes(tag)}
            onCheckedChange={() => toggle(tag)}
            onSelect={(e) => e.preventDefault()}
          >
            {tag}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])}>
              <X /> Effacer les tags
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
