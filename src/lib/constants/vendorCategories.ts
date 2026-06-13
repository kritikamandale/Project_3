export const VENDOR_CATEGORIES = [
  { value: 'venue',          label: 'Venue',              icon: '🏛️' },
  { value: 'catering',       label: 'Catering',           icon: '🍽️' },
  { value: 'photography',    label: 'Photography',        icon: '📸' },
  { value: 'videography',    label: 'Videography',        icon: '🎥' },
  { value: 'decoration',     label: 'Decoration',         icon: '🌸' },
  { value: 'music',          label: 'Music / DJ',         icon: '🎵' },
  { value: 'mehendi',        label: 'Mehendi Artist',     icon: '✋' },
  { value: 'makeup',         label: 'Makeup & Hair',      icon: '💄' },
  { value: 'priest',         label: 'Pandit / Priest',    icon: '🙏' },
  { value: 'flowers',        label: 'Florist',            icon: '💐' },
  { value: 'cake',           label: 'Cake & Desserts',    icon: '🎂' },
  { value: 'invitation',     label: 'Invitation Design',  icon: '💌' },
  { value: 'tent',           label: 'Tent & Furniture',   icon: '⛺' },
  { value: 'light',          label: 'Lighting',           icon: '💡' },
  { value: 'travel',         label: 'Travel & Transport', icon: '🚌' },
  { value: 'security',       label: 'Security',           icon: '🛡️' },
  { value: 'event_planner',  label: 'Event Planner',      icon: '📋' },
  { value: 'choreographer',  label: 'Choreographer',      icon: '💃' },
  { value: 'anchor',         label: 'Anchor / MC',        icon: '🎙️' },
  { value: 'other',          label: 'Other',              icon: '📦' },
] as const;

export type VendorCategoryValue = typeof VENDOR_CATEGORIES[number]['value'];

export const VENDOR_STATUS = {
  PENDING:   'pending',
  VERIFIED:  'verified',
  SUSPENDED: 'suspended',
  REJECTED:  'rejected',
} as const;

export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];

export const BOOKING_STATUS = {
  ENQUIRY:   'enquiry',
  QUOTED:    'quoted',
  CONFIRMED: 'confirmed',
  ADVANCE_PAID: 'advance_paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED:  'disputed',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
