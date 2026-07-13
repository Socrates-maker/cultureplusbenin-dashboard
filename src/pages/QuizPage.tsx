import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { api, type Paginated } from '@/lib/api';
import { useCrudMutations } from '@/lib/crud';
import type { QuizCategory, QuizDifficulty, QuizOption } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface QuizQuestionRow {
  id: string;
  question: string;
  feedback: string;
  difficulty: QuizDifficulty;
  categoryId: string | null;
  isPublished: boolean;
  options: (QuizOption & { id: string })[];
}

const DIFFICULTIES: { value: QuizDifficulty; label: string }[] = [
  { value: 'facile', label: 'Facile' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'expert', label: 'Expert' },
];

const diffVariant: Record<QuizDifficulty, 'success' | 'warning' | 'destructive'> = {
  facile: 'success',
  intermediaire: 'warning',
  expert: 'destructive',
};

export function QuizPage() {
  return (
    <div>
      <PageHeader
        title="Quiz"
        description="Gérez les questions et catégories du jeu de quiz."
      />
      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        <TabsContent value="questions">
          <QuestionsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function useCategories() {
  return useQuery<QuizCategory[]>({
    queryKey: ['/admin/quiz/categories'],
    queryFn: async () => {
      const { data } = await api.get<QuizCategory[]>('/admin/quiz/categories');
      return data;
    },
  });
}

function QuestionsTab() {
  const { data, isLoading } = useQuery<Paginated<QuizQuestionRow>>({
    queryKey: ['/admin/quiz/questions'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<QuizQuestionRow>>(
        '/admin/quiz/questions',
        { params: { limit: 100 } },
      );
      return data;
    },
  });
  const categories = useCategories();
  const { remove } = useCrudMutations('/admin/quiz/questions', 'Question');
  const [editing, setEditing] = useState<QuizQuestionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<QuizQuestionRow | null>(null);

  const catName = (id: string | null) =>
    categories.data?.find((c) => c._id === id)?.name ?? '—';

  const rows = data?.data ?? [];

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus /> Nouvelle question
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState message="Aucune question." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Difficulté</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Publiée</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-sm font-medium">{q.question}</TableCell>
                  <TableCell>
                    <Badge variant={diffVariant[q.difficulty]}>{q.difficulty}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{catName(q.categoryId)}</TableCell>
                  <TableCell className="text-muted-foreground">{q.options.length}</TableCell>
                  <TableCell>
                    {q.isPublished ? (
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
                        <DropdownMenuItem onClick={() => setEditing(q)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(q)}
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
        <QuestionDialog
          question={editing}
          categories={categories.data ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Supprimer cette question ?"
        description={deleting?.question}
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

function QuestionDialog({
  question,
  categories,
  onClose,
}: {
  question: QuizQuestionRow | null;
  categories: QuizCategory[];
  onClose: () => void;
}) {
  const { create, update } = useCrudMutations('/admin/quiz/questions', 'Question');
  const [text, setText] = useState(question?.question ?? '');
  const [feedback, setFeedback] = useState(question?.feedback ?? '');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(question?.difficulty ?? 'facile');
  const [categoryId, setCategoryId] = useState<string>(question?.categoryId ?? '');
  const [isPublished, setIsPublished] = useState(question?.isPublished ?? true);
  const [options, setOptions] = useState<{ label: string; isCorrect: boolean }[]>(
    question?.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })) ?? [
      { label: '', isCorrect: true },
      { label: '', isCorrect: false },
    ],
  );

  const setOption = (i: number, patch: Partial<{ label: string; isCorrect: boolean }>) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      question: text,
      feedback,
      difficulty,
      categoryId: categoryId || undefined,
      isPublished,
      options: options.filter((o) => o.label.trim()),
    };
    if (question) {
      update.mutate({ id: question.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? 'Modifier la question' : 'Nouvelle question'}</DialogTitle>
          <DialogDescription>
            Définissez l'énoncé, les options (au moins 2) et la bonne réponse.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Question *</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Feedback (explication) *</Label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulté</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as QuizDifficulty)}>
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
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={(v) => setCategoryId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Options — cochez la bonne réponse</Label>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOptions((prev) =>
                      prev.map((op, idx) => ({ ...op, isCorrect: idx === i })),
                    )
                  }
                  className={
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ' +
                    (o.isCorrect
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'text-muted-foreground')
                  }
                  title="Marquer comme correcte"
                >
                  <Check className="h-4 w-4" />
                </button>
                <Input
                  value={o.label}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => setOption(i, { label: e.target.value })}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptions((prev) => [...prev, { label: '', isCorrect: false }])}
            >
              <Plus /> Ajouter une option
            </Button>
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
              {question ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useCategories();
  const { create } = useCrudMutations('/admin/quiz/categories', 'Catégorie');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), description: description || undefined },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          setDescription('');
          setOpen(false);
        },
      },
    );
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Nouvelle catégorie
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : (data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState message="Aucune catégorie." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{c.description ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto depuis le nom" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
