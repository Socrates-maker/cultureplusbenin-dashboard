import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { FieldConfig } from '@/components/form/types';
import type { ModerationStatus } from '@/lib/types';

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

const locationField: FieldConfig = {
  name: 'location',
  label: 'Localisation',
  type: 'location',
  required: true,
};

export const resources: ResourceConfig[] = [
  {
    key: 'cities',
    path: '/cities',
    title: 'Villes',
    singular: 'Ville',
    description: 'Les villes et localités présentées sur le site.',
    titleKey: 'name',
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
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true, placeholder: 'Ouidah' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      {
        name: 'history',
        label: 'Histoire',
        type: 'richtext',
        help: 'Contexte historique (mise en forme possible, optionnel).',
        placeholder: "Racontez l'histoire de la ville…",
      },
      locationField,
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
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Ville', render: (r) => refName(r.city) },
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
        label: 'Ville',
        type: 'reference',
        required: true,
        reference: { path: '/cities', labelKey: 'name' },
      },
      locationField,
    ],
  },
  {
    key: 'historical-figures',
    path: '/historical-figures',
    title: 'Figures historiques',
    singular: 'Figure historique',
    description: 'Personnalités et figures marquantes rattachées à une ville.',
    titleKey: 'name',
    columns: [
      { header: 'Nom', key: 'name', className: 'font-medium' },
      { header: 'Ville', render: (r) => refName(r.city) },
      { header: 'Description', render: (r) => truncate(r.description) },
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
        label: 'Ville',
        type: 'reference',
        required: true,
        reference: { path: '/cities', labelKey: 'name' },
      },
    ],
  },
  {
    key: 'galleries',
    path: '/galleries',
    title: 'Galeries',
    singular: 'Galerie',
    description: 'Collections de médias rattachées à une ville ou un site.',
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
          { label: 'Ville', value: 'City' },
          { label: 'Site touristique', value: 'TouristSite' },
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
    description: 'Témoignages sur une ville, un site ou une figure historique.',
    titleKey: 'title',
    moderation: true,
    columns: [
      { header: 'Titre', key: 'title', className: 'font-medium' },
      { header: 'Sujet', render: (r) => <Badge variant="secondary">{String(r.subjectType)}</Badge> },
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
          { label: 'Ville', value: 'City' },
          { label: 'Site touristique', value: 'TouristSite' },
          { label: 'Figure historique', value: 'HistoricalFigure' },
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
          },
        },
      },
    ],
  },
];

export function resourceByKey(key: string) {
  return resources.find((r) => r.key === key);
}
