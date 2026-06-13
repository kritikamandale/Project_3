// ─── Basic lookup tables (used across the app) ────────────────────────────────

export const EVENT_TYPES = [
  { value: 'wedding',        label: 'Wedding',             icon: '💍', color: '#C2185B' },
  { value: 'engagement',     label: 'Engagement',          icon: '💎', color: '#9C27B0' },
  { value: 'birthday',       label: 'Birthday',            icon: '🎂', color: '#FF6B00' },
  { value: 'puja',           label: 'Puja / Havan',        icon: '🪔', color: '#D4AF37' },
  { value: 'corporate',      label: 'Corporate Event',     icon: '🏢', color: '#006994' },
  { value: 'babyshower',     label: 'Baby Shower',         icon: '👶', color: '#F48FB1' },
  { value: 'housewarming',   label: 'Housewarming',        icon: '🏠', color: '#8B5E3C' },
  { value: 'graduation',     label: 'Graduation',          icon: '🎓', color: '#2E7D32' },
  { value: 'anniversary',    label: 'Anniversary',         icon: '❤️',  color: '#C62828' },
  { value: 'festive',        label: 'Festive Celebration', icon: '🎊', color: '#F4A825' },
  { value: 'kitty_party',    label: 'Kitty Party',         icon: '🎀', color: '#FF9A3C' },
  { value: 'social',         label: 'Social Gathering',    icon: '🥂', color: '#4FB3CF' },
  { value: 'farewell',       label: 'Farewell',            icon: '✈️',  color: '#5C6BC0' },
  { value: 'family_meetup',  label: 'Family Meetup',       icon: '👨‍👩‍👧‍👦', color: '#43A047' },
  { value: 'kiddie_party',   label: 'Kids Party',          icon: '🧒', color: '#FF7043' },
  { value: 'other',          label: 'Other',               icon: '📅', color: '#6B5244' },
] as const;

export type EventTypeValue = typeof EVENT_TYPES[number]['value'];

export const EVENT_STATUS = {
  DRAFT:      'draft',
  PUBLISHED:  'published',
  ONGOING:    'ongoing',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

export const GUEST_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  DECLINED:   'declined',
  MAYBE:      'maybe',
  WAITLIST:   'waitlist',
  CHECKED_IN: 'checked_in',
} as const;

export type GuestStatus = typeof GUEST_STATUS[keyof typeof GUEST_STATUS];

export const TASK_STATUS = {
  TODO:        'todo',
  IN_PROGRESS: 'in_progress',
  DONE:        'done',
  BLOCKED:     'blocked',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// ─── Event type template interfaces ───────────────────────────────────────────

export interface ChecklistTemplateItem {
  id: string;
  title: string;
  category: string;
  dueOffsetDays: number;
  priority: 'low' | 'medium' | 'high';
}

export interface TimelineTemplateItem {
  id: string;
  title: string;
  dueOffsetDays: number;
  description?: string;
}

export interface BudgetCategoryTemplate {
  name: string;
  percentage: number;
}

export interface EventTypeTemplate {
  id: string;
  name: string;
  icon: string;
  pichwaiTheme: string;
  defaultChecklist: ChecklistTemplateItem[];
  defaultTimeline: TimelineTemplateItem[];
  suggestedVendorCategories: string[];
  defaultBudgetCategories: BudgetCategoryTemplate[];
  estimatedGuestsRange: { min: number; max: number };
}

// ─── Full event type templates ─────────────────────────────────────────────────

export const EVENT_TYPE_TEMPLATES: Record<string, EventTypeTemplate> = {
  wedding: {
    id: 'wedding',
    name: 'Wedding',
    icon: '💍',
    pichwaiTheme: 'red-gold',
    estimatedGuestsRange: { min: 50, max: 500 },
    defaultChecklist: [
      { id: 'w-c1',  title: 'Book venue',                   category: 'venue',         dueOffsetDays: -120, priority: 'high'   },
      { id: 'w-c2',  title: 'Book photographer & videographer', category: 'photography', dueOffsetDays: -90,  priority: 'high'   },
      { id: 'w-c3',  title: 'Finalize catering menu',        category: 'catering',      dueOffsetDays: -75,  priority: 'high'   },
      { id: 'w-c4',  title: 'Order wedding outfits',         category: 'outfits',       dueOffsetDays: -60,  priority: 'high'   },
      { id: 'w-c5',  title: 'Book mehendi artist',           category: 'mehendi',       dueOffsetDays: -45,  priority: 'medium' },
      { id: 'w-c6',  title: 'Book makeup artist',            category: 'makeup',        dueOffsetDays: -45,  priority: 'medium' },
      { id: 'w-c7',  title: 'Send wedding invitations',      category: 'invites',       dueOffsetDays: -45,  priority: 'high'   },
      { id: 'w-c8',  title: 'Book wedding band / DJ',        category: 'music',         dueOffsetDays: -40,  priority: 'medium' },
      { id: 'w-c9',  title: 'Arrange decoration vendor',     category: 'decoration',    dueOffsetDays: -35,  priority: 'medium' },
      { id: 'w-c10', title: 'Confirm guest RSVPs',           category: 'guests',        dueOffsetDays: -21,  priority: 'medium' },
      { id: 'w-c11', title: 'Confirm transportation plan',   category: 'transport',     dueOffsetDays: -14,  priority: 'low'    },
      { id: 'w-c12', title: 'Finalize seating arrangement',  category: 'seating',       dueOffsetDays: -7,   priority: 'high'   },
      { id: 'w-c13', title: 'Prepare welcome kits / gifts',  category: 'gifts',         dueOffsetDays: -5,   priority: 'low'    },
      { id: 'w-c14', title: 'Day-of coordination briefing',  category: 'logistics',     dueOffsetDays: -1,   priority: 'high'   },
    ],
    defaultTimeline: [
      { id: 'w-t1', title: 'Start planning',        dueOffsetDays: -180, description: 'Kick off planning, set budget & shortlist venues' },
      { id: 'w-t2', title: 'Venue booked',          dueOffsetDays: -120, description: 'Venue confirmed and advance paid' },
      { id: 'w-t3', title: 'Key vendors locked in', dueOffsetDays: -90,  description: 'Photographer, caterer, mehendi booked' },
      { id: 'w-t4', title: 'Invitations sent',      dueOffsetDays: -45,  description: 'Wedding cards dispatched to all guests' },
      { id: 'w-t5', title: 'RSVP deadline',         dueOffsetDays: -21,  description: 'Final guest count confirmed' },
      { id: 'w-t6', title: 'Final walk-through',    dueOffsetDays: -3,   description: 'Venue check with all vendors' },
      { id: 'w-t7', title: 'Wedding day',           dueOffsetDays: 0,    description: 'The big day!' },
    ],
    suggestedVendorCategories: ['venue', 'catering', 'photography', 'decoration', 'mehendi', 'makeup', 'music', 'transport', 'flowers', 'invitation', 'event_planner'],
    defaultBudgetCategories: [
      { name: 'Venue',                percentage: 25 },
      { name: 'Catering',             percentage: 33 },
      { name: 'Photography / Video',  percentage: 12 },
      { name: 'Decoration & Flowers', percentage: 10 },
      { name: 'Music & Entertainment',percentage: 5  },
      { name: 'Outfits & Makeup',     percentage: 7  },
      { name: 'Invitations',          percentage: 2  },
      { name: 'Miscellaneous',        percentage: 6  },
    ],
  },

  birthday: {
    id: 'birthday',
    name: 'Birthday Party',
    icon: '🎂',
    pichwaiTheme: 'saffron-cream',
    estimatedGuestsRange: { min: 10, max: 150 },
    defaultChecklist: [
      { id: 'b-c1', title: 'Book venue or arrange home setup', category: 'venue',         dueOffsetDays: -30, priority: 'high'   },
      { id: 'b-c2', title: 'Send invitations',                 category: 'invites',       dueOffsetDays: -21, priority: 'high'   },
      { id: 'b-c3', title: 'Book entertainment / performer',   category: 'entertainment', dueOffsetDays: -20, priority: 'medium' },
      { id: 'b-c4', title: 'Arrange catering / food order',    category: 'catering',      dueOffsetDays: -14, priority: 'high'   },
      { id: 'b-c5', title: 'Order birthday cake',              category: 'cake',          dueOffsetDays: -7,  priority: 'high'   },
      { id: 'b-c6', title: 'Plan games & activities',          category: 'activities',    dueOffsetDays: -7,  priority: 'medium' },
      { id: 'b-c7', title: 'Buy / arrange return gifts',       category: 'gifts',         dueOffsetDays: -5,  priority: 'medium' },
      { id: 'b-c8', title: 'Set up decorations',               category: 'decoration',    dueOffsetDays: -1,  priority: 'medium' },
      { id: 'b-c9', title: 'Confirm final guest count',        category: 'guests',        dueOffsetDays: -3,  priority: 'medium' },
    ],
    defaultTimeline: [
      { id: 'b-t1', title: 'Planning starts',    dueOffsetDays: -45, description: 'Theme decided, venue shortlisted' },
      { id: 'b-t2', title: 'Invitations sent',   dueOffsetDays: -21, description: 'Cards / WhatsApp invites out' },
      { id: 'b-t3', title: 'RSVP deadline',      dueOffsetDays: -7,  description: 'Final headcount confirmed' },
      { id: 'b-t4', title: 'Setup day',          dueOffsetDays: -1,  description: 'Venue decorated, cake picked up' },
      { id: 'b-t5', title: 'Birthday celebration', dueOffsetDays: 0, description: 'Party time!' },
    ],
    suggestedVendorCategories: ['venue', 'catering', 'cake', 'entertainment', 'decoration', 'photographer'],
    defaultBudgetCategories: [
      { name: 'Venue / Setup',    percentage: 20 },
      { name: 'Catering & Food',  percentage: 28 },
      { name: 'Cake',             percentage: 10 },
      { name: 'Entertainment',    percentage: 18 },
      { name: 'Decoration',       percentage: 12 },
      { name: 'Photography',      percentage: 7  },
      { name: 'Return Gifts',     percentage: 5  },
    ],
  },

  anniversary: {
    id: 'anniversary',
    name: 'Anniversary',
    icon: '❤️',
    pichwaiTheme: 'rose-gold',
    estimatedGuestsRange: { min: 10, max: 200 },
    defaultChecklist: [
      { id: 'a-c1', title: 'Book restaurant / venue',       category: 'venue',       dueOffsetDays: -60, priority: 'high'   },
      { id: 'a-c2', title: 'Book photographer',             category: 'photography', dueOffsetDays: -45, priority: 'high'   },
      { id: 'a-c3', title: 'Send invitations to family',    category: 'invites',     dueOffsetDays: -30, priority: 'medium' },
      { id: 'a-c4', title: 'Arrange floral decorations',    category: 'decoration',  dueOffsetDays: -14, priority: 'medium' },
      { id: 'a-c5', title: 'Order special cake',            category: 'cake',        dueOffsetDays: -7,  priority: 'high'   },
      { id: 'a-c6', title: 'Plan memorable surprise',       category: 'activities',  dueOffsetDays: -7,  priority: 'medium' },
      { id: 'a-c7', title: 'Confirm catering / dinner',     category: 'catering',    dueOffsetDays: -5,  priority: 'high'   },
      { id: 'a-c8', title: 'Prepare photo slideshow',       category: 'memories',    dueOffsetDays: -3,  priority: 'low'    },
    ],
    defaultTimeline: [
      { id: 'a-t1', title: 'Planning begins',      dueOffsetDays: -60, description: 'Venue shortlisted, theme finalized' },
      { id: 'a-t2', title: 'Invitations sent',     dueOffsetDays: -30, description: 'Family & close friends invited' },
      { id: 'a-t3', title: 'All bookings done',    dueOffsetDays: -14, description: 'Photographer, florist, cake confirmed' },
      { id: 'a-t4', title: 'Preparations done',    dueOffsetDays: -1,  description: 'Venue setup, cake collected' },
      { id: 'a-t5', title: 'Anniversary day',      dueOffsetDays: 0,   description: 'Celebrate together!' },
    ],
    suggestedVendorCategories: ['venue', 'catering', 'photography', 'decoration', 'flowers', 'cake', 'music'],
    defaultBudgetCategories: [
      { name: 'Venue / Dinner',    percentage: 30 },
      { name: 'Photography',       percentage: 20 },
      { name: 'Decoration',        percentage: 15 },
      { name: 'Cake & Sweets',     percentage: 10 },
      { name: 'Music & Ambiance',  percentage: 10 },
      { name: 'Gifts & Surprises', percentage: 10 },
      { name: 'Miscellaneous',     percentage: 5  },
    ],
  },

  puja: {
    id: 'puja',
    name: 'Puja / Havan',
    icon: '🪔',
    pichwaiTheme: 'gold-saffron',
    estimatedGuestsRange: { min: 10, max: 300 },
    defaultChecklist: [
      { id: 'p-c1', title: 'Fix muhurat with pandit',       category: 'priest',    dueOffsetDays: -45, priority: 'high'   },
      { id: 'p-c2', title: 'Book pandit / purohit',         category: 'priest',    dueOffsetDays: -30, priority: 'high'   },
      { id: 'p-c3', title: 'Invite family & relatives',     category: 'invites',   dueOffsetDays: -21, priority: 'high'   },
      { id: 'p-c4', title: 'Arrange venue / mandap',        category: 'venue',     dueOffsetDays: -21, priority: 'high'   },
      { id: 'p-c5', title: 'Prepare pooja samagri list',    category: 'samagri',   dueOffsetDays: -14, priority: 'high'   },
      { id: 'p-c6', title: 'Book caterer for prasad / langar', category: 'catering', dueOffsetDays: -14, priority: 'high'  },
      { id: 'p-c7', title: 'Arrange flowers & decoration',  category: 'decoration',dueOffsetDays: -7,  priority: 'medium' },
      { id: 'p-c8', title: 'Purchase pooja samagri',        category: 'samagri',   dueOffsetDays: -3,  priority: 'high'   },
      { id: 'p-c9', title: 'Setup havan kund / altar',      category: 'setup',     dueOffsetDays: -1,  priority: 'high'   },
    ],
    defaultTimeline: [
      { id: 'p-t1', title: 'Muhurat decided',    dueOffsetDays: -45, description: 'Auspicious date & time confirmed with pandit' },
      { id: 'p-t2', title: 'Invitations sent',   dueOffsetDays: -21, description: 'Family & neighbours informed' },
      { id: 'p-t3', title: 'Samagri arranged',   dueOffsetDays: -3,  description: 'All puja items purchased' },
      { id: 'p-t4', title: 'Venue setup',        dueOffsetDays: -1,  description: 'Mandap, flowers, diyas set up' },
      { id: 'p-t5', title: 'Puja day',           dueOffsetDays: 0,   description: 'Havan & puja ceremony' },
    ],
    suggestedVendorCategories: ['priest', 'catering', 'decoration', 'flowers', 'tent', 'light'],
    defaultBudgetCategories: [
      { name: 'Pandit / Priest',   percentage: 10 },
      { name: 'Catering / Prasad', percentage: 32 },
      { name: 'Decoration',        percentage: 20 },
      { name: 'Samagri & Flowers', percentage: 18 },
      { name: 'Tent / Venue',      percentage: 12 },
      { name: 'Miscellaneous',     percentage: 8  },
    ],
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate Event',
    icon: '🏢',
    pichwaiTheme: 'blue-gold',
    estimatedGuestsRange: { min: 20, max: 500 },
    defaultChecklist: [
      { id: 'co-c1', title: 'Book conference venue',             category: 'venue',         dueOffsetDays: -60, priority: 'high'   },
      { id: 'co-c2', title: 'Confirm speakers / presenters',     category: 'speakers',      dueOffsetDays: -45, priority: 'high'   },
      { id: 'co-c3', title: 'Send corporate invitations',        category: 'invites',       dueOffsetDays: -30, priority: 'high'   },
      { id: 'co-c4', title: 'Arrange AV & tech equipment',       category: 'av_tech',       dueOffsetDays: -21, priority: 'high'   },
      { id: 'co-c5', title: 'Finalize catering / tea breaks',    category: 'catering',      dueOffsetDays: -14, priority: 'high'   },
      { id: 'co-c6', title: 'Prepare event materials / kits',    category: 'materials',     dueOffsetDays: -10, priority: 'medium' },
      { id: 'co-c7', title: 'Book anchor / MC',                  category: 'anchor',        dueOffsetDays: -14, priority: 'medium' },
      { id: 'co-c8', title: 'Arrange photography / coverage',    category: 'photography',   dueOffsetDays: -14, priority: 'medium' },
      { id: 'co-c9', title: 'Setup online registration page',    category: 'registration',  dueOffsetDays: -21, priority: 'high'   },
      { id: 'co-c10', title: 'Confirm final attendee count',     category: 'guests',        dueOffsetDays: -7,  priority: 'high'   },
      { id: 'co-c11', title: 'Prepare backup AV plan',           category: 'logistics',     dueOffsetDays: -3,  priority: 'medium' },
    ],
    defaultTimeline: [
      { id: 'co-t1', title: 'Event conceptualized',   dueOffsetDays: -90, description: 'Objectives, agenda, and budget defined' },
      { id: 'co-t2', title: 'Venue booked',           dueOffsetDays: -60, description: 'Venue confirmed with A/V capabilities' },
      { id: 'co-t3', title: 'Speakers confirmed',     dueOffsetDays: -45, description: 'All speakers and topics finalized' },
      { id: 'co-t4', title: 'Invitations sent',       dueOffsetDays: -30, description: 'Invites + event details dispatched' },
      { id: 'co-t5', title: 'RSVP deadline',          dueOffsetDays: -7,  description: 'Final attendee list confirmed' },
      { id: 'co-t6', title: 'Event day',              dueOffsetDays: 0,   description: 'Corporate event execution' },
    ],
    suggestedVendorCategories: ['venue', 'catering', 'photography', 'entertainment', 'anchor', 'transport', 'other'],
    defaultBudgetCategories: [
      { name: 'Venue & Setup',      percentage: 30 },
      { name: 'Catering',           percentage: 25 },
      { name: 'AV & Technology',    percentage: 15 },
      { name: 'Photography / Media',percentage: 10 },
      { name: 'Speaker / Anchor',   percentage: 8  },
      { name: 'Materials & Kits',   percentage: 7  },
      { name: 'Miscellaneous',      percentage: 5  },
    ],
  },

  babyshower: {
    id: 'babyshower',
    name: 'Baby Shower',
    icon: '👶',
    pichwaiTheme: 'rose-cream',
    estimatedGuestsRange: { min: 10, max: 80 },
    defaultChecklist: [
      { id: 'bs-c1', title: 'Choose venue (home or hall)',    category: 'venue',       dueOffsetDays: -30, priority: 'high'   },
      { id: 'bs-c2', title: 'Send invitations',              category: 'invites',     dueOffsetDays: -21, priority: 'high'   },
      { id: 'bs-c3', title: 'Plan theme & decorations',      category: 'decoration',  dueOffsetDays: -21, priority: 'high'   },
      { id: 'bs-c4', title: 'Book photographer',             category: 'photography', dueOffsetDays: -14, priority: 'medium' },
      { id: 'bs-c5', title: 'Arrange catering / snacks',     category: 'catering',    dueOffsetDays: -10, priority: 'high'   },
      { id: 'bs-c6', title: 'Order theme cake',              category: 'cake',        dueOffsetDays: -7,  priority: 'high'   },
      { id: 'bs-c7', title: 'Plan baby shower games',        category: 'activities',  dueOffsetDays: -7,  priority: 'medium' },
      { id: 'bs-c8', title: 'Prepare return gift bags',      category: 'gifts',       dueOffsetDays: -5,  priority: 'medium' },
      { id: 'bs-c9', title: 'Setup decorations',             category: 'decoration',  dueOffsetDays: -1,  priority: 'medium' },
    ],
    defaultTimeline: [
      { id: 'bs-t1', title: 'Planning starts',    dueOffsetDays: -35, description: 'Theme chosen, guest list prepared' },
      { id: 'bs-t2', title: 'Invitations sent',   dueOffsetDays: -21, description: 'Invites to close family & friends' },
      { id: 'bs-t3', title: 'RSVP deadline',      dueOffsetDays: -7,  description: 'Final headcount confirmed' },
      { id: 'bs-t4', title: 'Setup day',          dueOffsetDays: -1,  description: 'Venue decorated, cake ordered' },
      { id: 'bs-t5', title: 'Baby shower day',    dueOffsetDays: 0,   description: 'Celebrate the new arrival!' },
    ],
    suggestedVendorCategories: ['venue', 'catering', 'cake', 'decoration', 'photographer', 'flowers'],
    defaultBudgetCategories: [
      { name: 'Venue / Setup',   percentage: 18 },
      { name: 'Catering',        percentage: 25 },
      { name: 'Cake',            percentage: 12 },
      { name: 'Decoration',      percentage: 22 },
      { name: 'Photography',     percentage: 10 },
      { name: 'Return Gifts',    percentage: 8  },
      { name: 'Miscellaneous',   percentage: 5  },
    ],
  },
};
