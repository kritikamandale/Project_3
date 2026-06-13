import type { EventTypeValue, EventStatus, TaskStatus } from '@/lib/constants/eventTypes';

export interface Event {
  id: string;
  hostId: string;
  title: string;
  slug: string;
  type: EventTypeValue;
  status: EventStatus;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  venue?: string;
  city: string;
  state: string;
  expectedGuests: number;
  actualGuests?: number;
  budgetTotal: number;
  budgetSpent: number;
  coverImage?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventTask {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  eventId: string;
  time: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
}

export interface CreateEventInput {
  title: string;
  type: EventTypeValue;
  date: string;
  endDate?: string;
  time?: string;
  venue?: string;
  city: string;
  state: string;
  expectedGuests: number;
  budgetTotal: number;
  description?: string;
  isPublic?: boolean;
}
