import { create } from 'zustand';
import type { Event, EventTask } from '@/types/event.types';

interface EventState {
  events: Event[];
  selectedEvent: Event | null;
  tasks: EventTask[];
  isLoading: boolean;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  selectEvent: (event: Event | null) => void;
  setTasks: (tasks: EventTask[]) => void;
  addTask: (task: EventTask) => void;
  updateTask: (id: string, updates: Partial<EventTask>) => void;
  setLoading: (loading: boolean) => void;
}

export const useEventStore = create<EventState>()((set) => ({
  events: [],
  selectedEvent: null,
  tasks: [],
  isLoading: false,
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),
  updateEvent: (id, updates) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      selectedEvent: s.selectedEvent?.id === id ? { ...s.selectedEvent, ...updates } : s.selectedEvent,
    })),
  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
  selectEvent: (selectedEvent) => set({ selectedEvent }),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
