import { useMemo, useState } from 'react';
import { Check, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { ResourceConfig } from '@/config/resources';
import { useCrudMutations, useModeration, usePaginatedCollection } from '@/lib/crud';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from './PageHeader';
import { PaginationControls } from './PaginationControls';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { ResourceForm } from './form/ResourceForm';
import { formatDate } from '@/lib/utils';

type Row = Record<string, unknown> & { _id: string };

/** Flatten reference objects so the form receives ids, not populated docs. */
function toFormValues(config: ResourceConfig, row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const f of config.fields) {
    const v = out[f.name];
    if ((f.type === 'reference' || f.type === 'polymorphic') && v && typeof v === 'object') {
      out[f.name] = (v as Record<string, unknown>)._id;
    }
  }
  return out;
}

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  const isPendingTab = config.moderation && tab === 'pending';
  const listPath = isPendingTab ? `${config.path}/pending` : config.path;
  // Search is only wired on the public list endpoint (not the pending queue).
  const params =
    config.searchable && !isPendingTab && debouncedSearch
      ? { search: debouncedSearch }
      : undefined;
  const { rows, isLoading, isFetching, page, setPage, pageCount, total } =
    usePaginatedCollection<Row>(listPath, params);

  const { create, update, remove } = useCrudMutations(config.path, config.singular);
  const moderation = useModeration(config.path);
  const canModerate = config.moderation && hasRole('admin');

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    setFormOpen(true);
  };

  const submit = (values: Record<string, unknown>) => {
    if (editing) {
      update.mutate(
        { id: editing._id, payload: values },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      create.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const defaults = useMemo(
    () => (editing ? toFormValues(config, editing) : undefined),
    [editing, config],
  );

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button onClick={openCreate}>
            <Plus /> Ajouter
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {config.moderation ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'pending')}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              {canModerate && (
                <TabsTrigger value="pending">En attente</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        ) : (
          <span />
        )}

        {config.searchable && !isPendingTab && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Rechercher un ${config.singular.toLowerCase()}…`}
              className="pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              message={
                debouncedSearch
                  ? `Aucun résultat pour « ${debouncedSearch} ».`
                  : isPendingTab
                    ? 'Aucun contenu en attente de validation.'
                    : 'Aucun élément. Cliquez sur « Ajouter » pour commencer.'
              }
            />
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => (
                  <TableHead key={c.header}>{c.header}</TableHead>
                ))}
                <TableHead>Créé le</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  {config.columns.map((c) => (
                    <TableCell key={c.header} className={c.className}>
                      {c.render
                        ? c.render(row)
                        : String(row[c.key ?? ''] ?? '—')}
                    </TableCell>
                  ))}
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.createdAt as string)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canModerate && row.status !== 'approved' && (
                          <DropdownMenuItem
                            onClick={() => moderation.approve.mutate(row._id)}
                          >
                            <Check /> Approuver
                          </DropdownMenuItem>
                        )}
                        {canModerate && row.status !== 'rejected' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setRejectReason('');
                              setRejecting(row);
                            }}
                          >
                            <X /> Rejeter
                          </DropdownMenuItem>
                        )}
                        {canModerate && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={() => openEdit(row)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(row)}
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
          <PaginationControls
            page={page}
            pageCount={pageCount}
            total={total}
            disabled={isFetching}
            onPageChange={setPage}
          />
          </>
        )}
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 pb-4">
            <DialogTitle>
              {editing ? `Modifier — ${config.singular}` : `Nouveau ${config.singular.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <ResourceForm
            key={editing?._id ?? 'new'}
            fields={config.fields}
            defaultValues={defaults}
            isEditing={Boolean(editing)}
            submitting={create.isPending || update.isPending}
            onSubmit={submit}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Supprimer ce ${config.singular.toLowerCase()} ?`}
        description={`« ${String(deleting?.[config.titleKey] ?? '')} » sera supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })
        }
      />

      {/* Reject with reason */}
      <ConfirmDialog
        open={Boolean(rejecting)}
        onOpenChange={(v) => !v && setRejecting(null)}
        title="Rejeter ce contenu"
        description="Indiquez éventuellement une raison. Le contributeur pourra la consulter."
        confirmLabel="Rejeter"
        destructive
        loading={moderation.reject.isPending}
        onConfirm={() =>
          rejecting &&
          moderation.reject.mutate(
            { id: rejecting._id, reason: rejectReason || undefined },
            { onSuccess: () => setRejecting(null) },
          )
        }
      >
        <Textarea
          placeholder="Raison du rejet (optionnel)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
