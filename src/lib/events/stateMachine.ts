export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

interface TransitionRule {
  to: EventStatus;
  label: string;
  requiresReason?: boolean;
}

// Legal state transitions map
const TRANSITIONS: Record<EventStatus, TransitionRule[]> = {
  draft: [
    { to: 'published', label: 'Publish Event' },
    { to: 'cancelled', label: 'Cancel', requiresReason: true },
  ],
  published: [
    { to: 'ongoing',   label: 'Mark as Ongoing' },
    { to: 'cancelled', label: 'Cancel Event', requiresReason: true },
  ],
  ongoing: [
    { to: 'completed', label: 'Mark Complete' },
    { to: 'cancelled', label: 'Cancel Event', requiresReason: true },
  ],
  completed: [],
  cancelled: [],
};

export function canTransition(from: EventStatus, to: EventStatus): boolean {
  return TRANSITIONS[from].some(t => t.to === to);
}

// Throws a descriptive error on illegal transitions — call before any status update
export function assertTransition(from: EventStatus, to: EventStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}

export function getValidTransitions(from: EventStatus): TransitionRule[] {
  return TRANSITIONS[from];
}

export function getStatusLabel(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    draft:     'Draft',
    published: 'Published',
    ongoing:   'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status];
}

// Returns Tailwind classes for status badges
export function getStatusColor(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    draft:     'text-amber-700 bg-amber-50  border-amber-200',
    published: 'text-blue-700  bg-blue-50   border-blue-200',
    ongoing:   'text-green-700 bg-green-50  border-green-200',
    completed: 'text-purple-700 bg-purple-50 border-purple-200',
    cancelled: 'text-red-700   bg-red-50    border-red-200',
  };
  return map[status];
}

// Transitions automatically triggered by time (for cron/background job use)
export function getAutoTransition(
  status: EventStatus,
  eventDate: Date,
  now = new Date(),
): EventStatus | null {
  if (status === 'published' && eventDate <= now) return 'ongoing';
  const dayAfter = new Date(eventDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  if (status === 'ongoing' && now >= dayAfter) return 'completed';
  return null;
}
