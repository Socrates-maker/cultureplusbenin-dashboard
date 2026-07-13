import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, UploadCloud, ExternalLink, FileVideo, FileAudio } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useCrudMutations, usePaginatedCollection } from '@/lib/crud';
import type { Media, MediaOwnerType, MediaType } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { ReferenceSelect } from '@/components/form/ReferenceSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const OWNER_SOURCES: Record<MediaOwnerType, { path: string; labelKey: string }> = {
  City: { path: '/cities', labelKey: 'name' },
  TouristSite: { path: '/tourist-sites', labelKey: 'name' },
  Gallery: { path: '/galleries', labelKey: 'name' },
  HistoricalFigure: { path: '/historical-figures', labelKey: 'name' },
  Testimonial: { path: '/testimonials', labelKey: 'title' },
};

const OWNER_LABELS: Record<MediaOwnerType, string> = {
  City: 'Ville',
  TouristSite: 'Site touristique',
  Gallery: 'Galerie',
  HistoricalFigure: 'Figure historique',
  Testimonial: 'Témoignage',
};

function MediaThumb({ media }: { media: Media }) {
  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt={media.name}
        className="h-12 w-16 rounded object-cover"
      />
    );
  }
  const Icon = media.type === 'video' ? FileVideo : FileAudio;
  return (
    <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export function MediaPage() {
  const [ownerType, setOwnerType] = useState<MediaOwnerType | ''>('');
  const [owner, setOwner] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);

  const filter = ownerType && owner ? { ownerType, owner } : ownerType ? { ownerType } : undefined;
  const { rows, isLoading, isFetching, page, setPage, pageCount, total } =
    usePaginatedCollection<Media>('/media', filter);
  const { remove } = useCrudMutations('/media', 'Média');

  return (
    <div>
      <PageHeader
        title="Médias"
        description="Images, vidéos et audios rattachés à vos contenus."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Ajouter un média
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-56">
          <Select
            value={ownerType || undefined}
            onValueChange={(v) => {
              setOwnerType(v as MediaOwnerType);
              setOwner('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OWNER_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {ownerType && (
          <div className="w-64">
            <ReferenceSelect
              path={OWNER_SOURCES[ownerType].path}
              labelKey={OWNER_SOURCES[ownerType].labelKey}
              value={owner}
              onChange={setOwner}
              placeholder="Filtrer par élément"
            />
          </div>
        )}
        {(ownerType || owner) && (
          <Button
            variant="ghost"
            onClick={() => {
              setOwnerType('');
              setOwner('');
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState message="Aucun média." />
            </div>
          ) : (
            <>
            <div className="divide-y">
              {rows.map((m) => (
                <div key={m._id} className="flex items-center gap-4 p-4">
                  <MediaThumb media={m} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{m.type}</Badge>
                  <Badge variant="outline">{OWNER_LABELS[m.ownerType]}</Badge>
                  <a href={m.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon">
                      <ExternalLink />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(m)}
                    title="Modifier"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <PaginationControls
              page={page}
              pageCount={pageCount}
              total={total}
              disabled={isFetching}
              onPageChange={setPage}
            />
            </>
          )}
        </CardContent>
      </Card>

      <MediaFormDialog open={open} onOpenChange={setOpen} />

      {editing && (
        <MediaFormDialog
          open
          media={editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Supprimer ce média ?"
        description={`« ${deleting?.name ?? ''} » sera supprimé.`}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

function MediaFormDialog({
  open,
  onOpenChange,
  media,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  media?: Media;
}) {
  const isEditing = Boolean(media);
  const [name, setName] = useState(media?.name ?? '');
  const [description, setDescription] = useState(media?.description ?? '');
  const [ownerType, setOwnerType] = useState<MediaOwnerType | ''>(media?.ownerType ?? '');
  const [owner, setOwner] = useState(media?.owner ?? '');
  const [type, setType] = useState<MediaType>(media?.type ?? 'image');
  const [url, setUrl] = useState(media?.url ?? '');
  const [publicId, setPublicId] = useState<string | undefined>(media?.publicId);
  const { create, update } = useCrudMutations('/media', 'Média');
  const pending = create.isPending || update.isPending;

  const reset = () => {
    setName('');
    setDescription('');
    setOwnerType('');
    setOwner('');
    setType('image');
    setUrl('');
    setPublicId(undefined);
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string; publicId: string; type: MediaType }>(
        '/media/upload',
        form,
      );
      return data;
    },
    onSuccess: (res) => {
      setUrl(res.url);
      setPublicId(res.publicId);
      setType(res.type);
      toast.success('Fichier téléversé.');
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Téléversez un fichier ou saisissez une URL.');
      return;
    }
    const payload = { name, description, type, url, publicId, ownerType, owner };
    if (media) {
      update.mutate(
        { id: media._id, payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isEditing) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle>{isEditing ? 'Modifier le média' : 'Nouveau média'}</DialogTitle>
          <DialogDescription>
            Téléversez un fichier (Cloudinary) ou fournissez une URL, puis
            rattachez-le à un contenu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
          <div className="space-y-1.5">
            <Label>Fichier</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm text-muted-foreground hover:bg-muted/50">
              <UploadCloud className="h-5 w-5" />
              {upload.isPending
                ? 'Téléversement…'
                : url
                  ? 'Fichier actuel — cliquez pour remplacer'
                  : 'Cliquez pour choisir un fichier'}
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload.mutate(f);
                }}
              />
            </label>
            {url && (
              <p className="truncate text-xs text-muted-foreground">{url}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-name">Nom *</Label>
            <Input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-desc">Description *</Label>
            <Textarea
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MediaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rattaché à *</Label>
              <Select
                value={ownerType || undefined}
                onValueChange={(v) => {
                  setOwnerType(v as MediaOwnerType);
                  setOwner('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OWNER_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ownerType && (
            <div className="space-y-1.5">
              <Label>Élément *</Label>
              <ReferenceSelect
                path={OWNER_SOURCES[ownerType].path}
                labelKey={OWNER_SOURCES[ownerType].labelKey}
                value={owner}
                onChange={setOwner}
              />
            </div>
          )}
          </div>

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !ownerType || !owner}>
              {pending ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
