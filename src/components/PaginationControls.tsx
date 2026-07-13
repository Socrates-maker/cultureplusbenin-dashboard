import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Previous / next footer for paginated tables. Hidden when everything fits on one page. */
export function PaginationControls({
  page,
  pageCount,
  total,
  onPageChange,
  disabled,
}: Props) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <span className="text-sm text-muted-foreground">
        Page {page} sur {pageCount} · {total} élément{total > 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft /> Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
