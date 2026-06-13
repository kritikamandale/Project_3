import type { GuestStatus } from '@/lib/constants/eventTypes';

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  status: GuestStatus;
  side?: 'bride' | 'groom' | 'both' | 'neutral';
  relation?: string;
  plusOnes: number;
  tableNumber?: number;
  seatNumber?: string;
  dietaryPreference?: 'veg' | 'non_veg' | 'vegan' | 'jain';
  inviteToken?: string;
  inviteSentAt?: string;
  respondedAt?: string;
  checkedInAt?: string;
  notes?: string;
  createdAt: string;
}

export interface BulkGuestInput {
  name: string;
  email?: string;
  phone?: string;
  plusOnes?: number;
  side?: Guest['side'];
  relation?: string;
}

export interface SeatingTable {
  id: string;
  eventId: string;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  guests: string[];
}

export interface RSVPResponse {
  token: string;
  status: Extract<GuestStatus, 'confirmed' | 'declined' | 'maybe'>;
  plusOnes?: number;
  dietaryPreference?: Guest['dietaryPreference'];
  message?: string;
}
