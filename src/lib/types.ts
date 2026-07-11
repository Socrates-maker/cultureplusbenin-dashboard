export type Role = 'admin' | 'editor' | 'user';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Location {
  address?: string;
  latitude: number;
  longitude: number;
}

export interface BaseDoc {
  _id: string;
  id?: string;
  createdBy?: string | { _id: string; firstname?: string; lastname?: string };
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface City extends BaseDoc {
  name: string;
  description: string;
  history?: string;
  location: Location;
}

export interface TouristSite extends BaseDoc {
  name: string;
  description: string;
  history?: string;
  location: Location;
  city: string | City;
  status: ModerationStatus;
  rejectionReason?: string;
}

export interface HistoricalFigure extends BaseDoc {
  name: string;
  description: string;
  biography?: string;
  city: string | City;
}

export type GalleryOwnerType = 'City' | 'TouristSite';

export interface Gallery extends BaseDoc {
  name: string;
  description: string;
  ownerType: GalleryOwnerType;
  owner: string;
}

export type MediaType = 'image' | 'video' | 'audio';
export type MediaOwnerType =
  | 'City'
  | 'TouristSite'
  | 'Gallery'
  | 'HistoricalFigure'
  | 'Testimonial';

export interface Media extends BaseDoc {
  name: string;
  description: string;
  type: MediaType;
  url: string;
  publicId?: string;
  ownerType: MediaOwnerType;
  owner: string;
}

export type TestimonialSubjectType = 'City' | 'TouristSite' | 'HistoricalFigure';

export interface Testimonial extends BaseDoc {
  title: string;
  description: string;
  subjectType: TestimonialSubjectType;
  subject: string;
  status: ModerationStatus;
  rejectionReason?: string;
}

export interface User extends BaseDoc {
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
}

export type QuizDifficulty = 'facile' | 'intermediaire' | 'expert';

export interface QuizOption {
  _id?: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  feedback: string;
  difficulty: QuizDifficulty;
  categoryId?: string;
  options: QuizOption[];
  isPublished: boolean;
}

export type MemoryDifficulty = 'facile' | 'intermediaire' | 'expert';

export interface MemoryItem {
  _id: string;
  name: string;
  image: string;
  categoryId?: string;
  difficulty: MemoryDifficulty;
  isPublished: boolean;
}
