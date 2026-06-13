export type PaymentStatus = 'pending' | 'processing' | 'captured' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';

export interface Payment {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  eventId?: string;
  bookingId?: string;
  userId: string;
  description?: string;
  receipt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  amount: number;
  currency?: string;
  receipt: string;
  description?: string;
  bookingId?: string;
  eventId?: string;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  status: 'estimated' | 'invoiced' | 'paid';
  vendorId?: string;
  paymentId?: string;
  createdAt: string;
}
