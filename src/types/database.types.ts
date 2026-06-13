// Auto-generate this file with: npx supabase gen types typescript --local > src/types/database.types.ts
// Placeholder types until Supabase CLI generation is run

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          role: 'super_admin' | 'host' | 'vendor' | 'guest';
          plan: 'free' | 'basic' | 'premium' | 'enterprise';
          is_active: boolean;
          is_email_verified: boolean;
          is_phone_verified: boolean;
          city: string | null;
          state: string | null;
          country: string | null;
          firebase_uid: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          role?: 'super_admin' | 'host' | 'vendor' | 'guest';
          plan?: 'free' | 'basic' | 'premium' | 'enterprise';
          is_active?: boolean;
          is_email_verified?: boolean;
          is_phone_verified?: boolean;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          firebase_uid?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          slug: string;
          host_id: string;
          title: string;
          description: string | null;
          event_type: string;
          status: string;
          event_date: string;
          event_time: string | null;
          end_date: string | null;
          venue_name: string | null;
          venue_city: string | null;
          venue_state: string | null;
          expected_guests: number;
          confirmed_guests: number;
          total_budget: number;
          spent_budget: number;
          cover_image_url: string | null;
          is_private: boolean;
          invite_token: string;
          checklist: Json;
          timeline: Json;
          seating_layout: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          host_id: string;
          title: string;
          description?: string | null;
          event_type: string;
          status?: string;
          event_date: string;
          event_time?: string | null;
          venue_name?: string | null;
          venue_city?: string | null;
          venue_state?: string | null;
          expected_guests?: number;
          total_budget?: number;
          is_private?: boolean;
          invite_token?: string;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          rsvp_status: string;
          plus_one: boolean;
          meal_preference: string | null;
          side: string | null;
          relation: string | null;
          table_number: number | null;
          is_vip: boolean;
          consent_given: boolean;
          invite_token: string | null;
          check_in_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          rsvp_status?: string;
          plus_one?: boolean;
          meal_preference?: string | null;
          side?: string | null;
          relation?: string | null;
          is_vip?: boolean;
          consent_given?: boolean;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['guests']['Insert']>;
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          slug: string;
          category: string;
          description: string | null;
          city: string;
          state: string;
          phone: string;
          price_starting_from: number | null;
          price_range_max: number | null;
          average_rating: number;
          total_reviews: number;
          is_verified: string;
          is_active: boolean;
          is_featured: boolean;
          packages: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          slug: string;
          category: string;
          description?: string | null;
          city: string;
          state: string;
          phone: string;
          price_starting_from?: number | null;
          is_verified?: string;
          is_active?: boolean;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['vendors']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          vendor_id: string;
          host_id: string;
          status: string;
          service_date: string;
          quoted_amount: number | null;
          final_amount: number | null;
          advance_amount: number;
          advance_paid: boolean;
          balance_amount: number;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          vendor_id: string;
          host_id: string;
          status?: string;
          service_date: string;
          quoted_amount?: number | null;
          final_amount?: number | null;
          advance_amount?: number;
          advance_paid?: boolean;
          notes?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string | null;
          event_id: string | null;
          payer_id: string;
          payee_id: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          amount: number;
          currency: string;
          method: string | null;
          status: string;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          event_id?: string | null;
          payer_id: string;
          payee_id?: string | null;
          razorpay_order_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          description?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          read_at: string | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Json;
          is_read?: boolean;
          action_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: {
      v_active_events: { Row: Record<string, unknown> };
      v_vendor_leaderboard: { Row: Record<string, unknown> };
      v_event_budget_summary: { Row: Record<string, unknown> };
      v_guest_rsvp_summary: { Row: Record<string, unknown> };
    };
    Functions: {
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: 'super_admin' | 'host' | 'vendor' | 'guest';
      event_type: string;
      event_status: string;
      rsvp_status: string;
      vendor_category: string;
      booking_status: string;
      payment_status: string;
      plan_type: 'free' | 'basic' | 'premium' | 'enterprise';
      verification_status: string;
    };
  };
}
