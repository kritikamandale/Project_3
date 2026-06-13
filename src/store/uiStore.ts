import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  modalStack: string[];
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  openModal: (name: string) => void;
  closeModal: (name: string) => void;
  isModalOpen: (name: string) => boolean;
}

export const useUIStore = create<UIState>()((set, get) => ({
  sidebarOpen: true,
  theme: 'light',
  toasts: [],
  modalStack: [],
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openModal: (name) => set((s) => ({ modalStack: [...s.modalStack, name] })),
  closeModal: (name) => set((s) => ({ modalStack: s.modalStack.filter((m) => m !== name) })),
  isModalOpen: (name) => get().modalStack.includes(name),
}));
