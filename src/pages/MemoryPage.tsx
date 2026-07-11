import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useCrudMutations } from '@/lib/crud';
import type { MemoryDifficulty } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MemoryRow {
  id: string;
  name: string;
  image: string;
  categoryId: string | null;
  difficulty: MemoryDifficulty;
  isPublished: boolean;
}

const DIFFICULTIES: { value: MemoryDifficulty; label: string }[] = [
  { value: 'facile', label: 'Facile' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'expert', label: 'Expert' },
];

const diffVariant: Record<MemoryDifficulty, 'success' | 'warning' | 'destructive'> = {
  facile: 'success',
  intermediaire: 'warning',
  expert: 'destructive',
};

export function MemoryPage() {
  const { data, isLoading } = useQuery<{ data: MemoryRow[] }>({
    queryKey: ['/admin/memory/items'],
    queryFn: async () => {
      const { data } = await api.get<{ data: MemoryRow[] }>('/admin/memory/items', {
        params: { limit: 100 },
      });
      return data;
    },
  });
  const { remove } = useCrudMutations('/admin/memory/items', 'Carte');
  const [editing, setEditing] = useState<MemoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MemoryRow | null>(null);

  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Memory"
        description="Gérez les cartes (paires image + nom) du jeu de memory."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Nouvelle carte
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState message="Aucune carte." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Difficulté</TableHead>
                <TableHead>Publiée</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    <Badge variant={diffVariant[m.difficulty]}>{m.difficulty}</Badge>
                  </TableCell>
                  <TableCell>
                    {m.isPublished ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(m)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          <Trash2 /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {(creating || editing) && (
        <MemoryDialog
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Supprimer cette carte ?"
        description={deleting?.name}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

function MemoryDialog({
  item,
  onClose,
}: {
  item: MemoryRow | null;
  onClose: () => void;
}) {
  const { create, update } = useCrudMutations('/admin/memory/items', 'Carte');
  const [name, setName] = useState(item?.name ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>(item?.difficulty ?? 'facile');
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, image, difficulty, isPublished };
    if (item) {
      update.mutate({ id: item.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Modifier la carte' : 'Nouvelle carte'}</DialogTitle>
          <DialogDescription>
            Une carte associe un nom à une image (URL).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>URL de l'image *</Label>
            <Input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              required
            />
          </div>
          {image && (
            <img
              src={image}
              alt="Aperçu"
              className="h-24 w-24 rounded border object-cover"
            />
          )}
          <div className="space-y-1.5">
            <Label>Difficulté</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as MemoryDifficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <Label>Publiée</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {item ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
