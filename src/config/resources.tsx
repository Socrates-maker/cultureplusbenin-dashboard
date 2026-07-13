import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { FieldConfig, SelectOption } from '@/components/form/types';
import type { ModerationStatus, StoryCategory } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export interface ColumnConfig {
  header: string;
  /** Read a display value straight from a row key. */
  key?: string;
  /** Or render a custom cell. */
  render?: (row: Record<string, unknown>) => ReactNode;
  className?: string;
}

export interface ResourceConfig {
  key: string;
  path: string; // REST base
  title: string;
  singular: string;
  description: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  moderation?: boolean; // has approve / reject + pending queue
  /** Backend supports `?search=` free-text search on this resource. */
  searchable?: boolean;
  /** Backend supports `tags` (documents, `?tags=` filter and `/tags` route). */
  taggable?: boolean;
  /** Optional enum filter rendered as a <Select> above the list. */
  filter?: { name: string; placeholder: string; options: SelectOption[] };
  /** Extract a text label for a row (used in dialogs / delete confirmation). */
  titleKey: string;
}

function truncate(value: unknown, n = 60): string {
  const s = String(value ?? '');
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function refName(value: unknown): string {
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return String(o.name ?? o.title ?? o._id ?? '—');
  }
  return value ? truncate(value, 12) : '—';
}

export function StatusBadge({ status }: { status?: ModerationStatus }) {
  if (status === 'approved')
    return <Badge variant="success">Publié</Badge>;
  if (status === 'rejected')
    return <Badge variant="destructive">Rejeté</Badge>;
  return <Badge variant="warning">En attente</Badge>;
}

export function TagsCell({ tags }: { tags?: unknown }) {
  const list = Array.isArray(tags) ? (tags as string[]) : [];
  if (list.length === 0) return <>—</>;
  const shown = list.slice(0, 3);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((t) => (
        <Badge key={t} variant="outline">
          {t}
        </Badge>
      ))}
      {list.length > shown.length && (
        <Badge variant="secondary">+{list.length - shown.length}</Badge>
      )}
    </div>
  );
}

const tagsColumn = {
  header: 'Tags',
  render: (r: Record<string, unknown>) => <TagsCell tags={r.tags} />,
};

/** Free-form tags field, with autocomplete fed by `GET <path>/tags`. */
function tagsField(path: string): FieldConfig {
  return {
    name: 'tags',
    label: 'Tags',
    type: 'tags',
    tagSource: path,
    help: '20 tags max, 30 caractères chacun (normalisés en minuscules).',
  };
}

const locationField: FieldConfig = {
  name: 'location',
  label: 'Localisation',
  type: 'location',
  required: true,
};

/** Optional city attachment shared by the editorial resources. */
const optionalCityField: FieldConfig = {
  name: 'city',
  label: 'Commune',
  type: 'reference',
  reference: { path: '/cities', labelKey: 'name' },
  help: 'Optionnel — rattache le contenu à une commune.',
};

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  resistance: 'Résistance',
  spiritualite: 'Spiritualité',
  'histoire-contemporaine': 'Histoire contemporaine',
  conte: 'Conte',
};

const storyCategoryOptions: SelectOption[] = (
  Object.entries(STORY_CATEGORY_LABELS) as [StoryCategory, string][]
).map(([value, label]) => ({ value, label }));

function CategoryBadge({ category }: { category?: unknown }) {
  const label = STORY_CATEGORY_LABELS[category as StoryCategory];
  return label ? <Badge variant="secondary">{label}</Badge> : <>—</>;
}

export const resources: ResourceConfig[] = [
  {
    key: 'cities',
    path: '/cities',
    title: 'Communes',
    singular: 'Commune',
    description: 'Les communes et localités présentées sur le site.',
    titleKey: 'name',
    searchable: true,
    taggable: true,
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Description', render: (r) => truncate(r.description) },
      {
        header: 'Localisation',
        render: (r) => {
          const loc = r.location as { address?: string } | undefined;
          return loc?.address ?? '—';
        },
      },
      tagsColumn,
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true, placeholder: 'Ouidah' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'history',
        label: 'Histoire',
        type: 'richtext',
        help: 'Contexte historique (mise en forme possible, optionnel).',
        placeholder: "Racontez l'histoire de la commune…",
      },
      locationField,
      tagsField('/cities'),
    ],
  },
  {
    key: 'tourist-sites',
    path: '/tourist-sites',
    title: 'Sites touristiques',
    singular: 'Site touristique',
    description: 'Sites et monuments. Les contributions publiques passent en modération.',
    titleKey: 'name',
    moderation: true,
    searchable: true,
    taggable: true,
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Commune', render: (r) => refName(r.city) },
      tagsColumn,
      {
        header: 'Statut',
        render: (r) => <StatusBadge status={r.status as ModerationStatus} />,
      },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'history',
        label: 'Histoire',
        type: 'richtext',
        placeholder: "Racontez l'histoire du site…",
      },
      {
        name: 'city',
        label: 'Commune',
        type: 'reference',
        required: true,
        reference: { path: '/cities', labelKey: 'name' },
      },
      locationField,
      tagsField('/tourist-sites'),
    ],
  },
  {
    key: 'historical-figures',
    path: '/historical-figures',
    title: 'Figures historiques',
    singular: 'Figure historique',
    description: 'Personnalités et figures marquantes rattachées à une commune.',
    titleKey: 'name',
    searchable: true,
    taggable: true,
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Commune', render: (r) => refName(r.city) },
      { header: 'Description', render: (r) => truncate(r.description) },
      tagsColumn,
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'biography',
        label: 'Biographie',
        type: 'richtext',
        placeholder: 'Rédigez la biographie…',
      },
      {
        name: 'city',
        label: 'Commune',
        type: 'reference',
        required: true,
        reference: { path: '/cities', labelKey: 'name' },
      },
      tagsField('/historical-figures'),
    ],
  },
  {
    key: 'stories',
    path: '/stories',
    title: 'Récits',
    singular: 'Récit',
    description: 'Récits et histoires : résistance, spiritualité, histoire contemporaine, contes.',
    titleKey: 'title',
    searchable: true,
    taggable: true,
    filter: {
      name: 'category',
      placeholder: 'Filtrer par catégorie',
      options: storyCategoryOptions,
    },
    columns: [
      { header: 'Titre', key: 'title', className: 'font-medium' },
      { header: 'Catégorie', render: (r) => <CategoryBadge category={r.category} /> },
      { header: 'Commune', render: (r) => refName(r.city) },
      tagsColumn,
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'body',
        label: 'Contenu',
        type: 'richtext',
        required: true,
        placeholder: 'Rédigez le récit…',
      },
      {
        name: 'category',
        label: 'Catégorie',
        type: 'select',
        required: true,
        options: storyCategoryOptions,
      },
      optionalCityField,
      tagsField('/stories'),
    ],
  },
  {
    key: 'traditions',
    path: '/traditions',
    title: 'Traditions',
    singular: 'Tradition',
    description: 'Traditions et pratiques culturelles, avec leur origine.',
    titleKey: 'title',
    searchable: true,
    taggable: true,
    columns: [
      { header: 'Titre', key: 'title', className: 'font-medium' },
      { header: 'Commune', render: (r) => refName(r.city) },
      { header: 'Description', render: (r) => truncate(r.description) },
      tagsColumn,
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'origin',
        label: 'Origine',
        type: 'richtext',
        placeholder: "Racontez l'origine de la tradition…",
      },
      optionalCityField,
      tagsField('/traditions'),
    ],
  },
  {
    key: 'events',
    path: '/events',
    title: 'Événements',
    singular: 'Événement',
    description: 'Événements culturels, triés chronologiquement.',
    titleKey: 'title',
    searchable: true,
    taggable: true,
    columns: [
      { header: 'Titre', key: 'title', className: 'font-medium' },
      { header: 'Date', render: (r) => formatDate(r.date as string) },
      { header: 'Commune', render: (r) => refName(r.city) },
      tagsColumn,
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      {
        name: 'origin',
        label: 'Origine',
        type: 'richtext',
        placeholder: "Racontez l'origine de l'événement…",
      },
      optionalCityField,
      tagsField('/events'),
    ],
  },
  {
    key: 'galleries',
    path: '/galleries',
    title: 'Galeries',
    singular: 'Galerie',
    description: 'Collections de médias rattachées à une commune ou un site.',
    titleKey: 'name',
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Type', render: (r) => <Badge variant="secondary">{String(r.ownerType)}</Badge> },
      { header: 'Description', render: (r) => truncate(r.description) },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'ownerType',
        label: 'Type de rattachement',
        type: 'select',
        required: true,
        createOnly: true,
        options: [
          { label: 'Commune', value: 'City' },
          { label: 'Site touristique', value: 'TouristSite' },
          { label: 'Récit', value: 'Story' },
          { label: 'Tradition', value: 'Tradition' },
          { label: 'Événement', value: 'Event' },
        ],
      },
      {
        name: 'owner',
        label: 'Rattaché à',
        type: 'polymorphic',
        required: true,
        createOnly: true,
        polymorphic: {
          dependsOn: 'ownerType',
          sources: {
            City: { path: '/cities', labelKey: 'name' },
            TouristSite: { path: '/tourist-sites', labelKey: 'name' },
            Story: { path: '/stories', labelKey: 'title' },
            Tradition: { path: '/traditions', labelKey: 'title' },
            Event: { path: '/events', labelKey: 'title' },
          },
        },
      },
    ],
  },
  {
    key: 'testimonials',
    path: '/testimonials',
    title: 'Témoignages',
    singular: 'Témoignage',
    description: 'Témoignages sur une commune, un site ou une figure historique.',
    titleKey: 'title',
    moderation: true,
    taggable: true,
    columns: [
      { header: 'Titre', key: 'title', className: 'font-medium' },
      { header: 'Sujet', render: (r) => <Badge variant="secondary">{String(r.subjectType)}</Badge> },
      tagsColumn,
      {
        header: 'Statut',
        render: (r) => <StatusBadge status={r.status as ModerationStatus} />,
      },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'subjectType',
        label: 'Type de sujet',
        type: 'select',
        required: true,
        createOnly: true,
        options: [
          { label: 'Commune', value: 'City' },
          { label: 'Site touristique', value: 'TouristSite' },
          { label: 'Figure historique', value: 'HistoricalFigure' },
          { label: 'Récit', value: 'Story' },
          { label: 'Tradition', value: 'Tradition' },
          { label: 'Événement', value: 'Event' },
        ],
      },
      {
        name: 'subject',
        label: 'Sujet',
        type: 'polymorphic',
        required: true,
        createOnly: true,
        polymorphic: {
          dependsOn: 'subjectType',
          sources: {
            City: { path: '/cities', labelKey: 'name' },
            TouristSite: { path: '/tourist-sites', labelKey: 'name' },
            HistoricalFigure: { path: '/historical-figures', labelKey: 'name' },
            Story: { path: '/stories', labelKey: 'title' },
            Tradition: { path: '/traditions', labelKey: 'title' },
            Event: { path: '/events', labelKey: 'title' },
          },
        },
      },
      tagsField('/testimonials'),
    ],
  },
];

export function resourceByKey(key: string) {
  return resources.find((r) => r.key === key);
}
