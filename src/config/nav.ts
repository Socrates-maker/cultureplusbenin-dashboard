import {
  Building2,
  Images,
  LayoutDashboard,
  MapPinned,
  MessageSquareQuote,
  Users,
  Landmark,
  Brain,
  HelpCircle,
  FileImage,
  BookOpen,
  Scroll,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/lib/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL: Role[] = ['admin', 'editor'];
const ADMIN: Role[] = ['admin'];

export const navSections: NavSection[] = [
  {
    title: 'Général',
    items: [
      { label: 'Tableau de bord', to: '/', icon: LayoutDashboard, roles: ALL },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { label: 'Communes', to: '/cities', icon: Building2, roles: ALL },
      { label: 'Sites touristiques', to: '/tourist-sites', icon: MapPinned, roles: ALL },
      { label: 'Figures historiques', to: '/historical-figures', icon: Landmark, roles: ALL },
      { label: 'Récits', to: '/stories', icon: BookOpen, roles: ALL },
      { label: 'Traditions', to: '/traditions', icon: Scroll, roles: ALL },
      { label: 'Événements', to: '/events', icon: CalendarDays, roles: ALL },
      { label: 'Galeries', to: '/galleries', icon: Images, roles: ALL },
      { label: 'Témoignages', to: '/testimonials', icon: MessageSquareQuote, roles: ALL },
      { label: 'Médias', to: '/media', icon: FileImage, roles: ALL },
    ],
  },
  {
    title: 'Jeux',
    items: [
      { label: 'Quiz', to: '/quiz', icon: HelpCircle, roles: ADMIN },
      { label: 'Memory', to: '/memory', icon: Brain, roles: ADMIN },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Utilisateurs', to: '/users', icon: Users, roles: ADMIN },
    ],
  },
];
