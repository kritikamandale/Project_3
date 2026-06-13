import type { VendorCategoryValue, VendorStatus, BookingStatus } from '@/lib/constants/vendorCategories';

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  category: VendorCategoryValue;
  status: VendorStatus;
  description: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website?: string;
  instagram?: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  tags: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  hostId: string;
  eventId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface Booking {
  id: string;
  eventId: string;
  vendorId: string;
  hostId: string;
  status: BookingStatus;
  serviceDate: string;
  amount: number;
  advancePaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  vendorId: string;
  eventId: string;
  serviceDate: string;
  amount: number;
  notes?: string;
}
