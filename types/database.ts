export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PropertyType =
  | "single_family"
  | "condo"
  | "townhouse"
  | "land"
  | "multi_family";

export type ListingStatus =
  | "draft"
  | "intake_pending"
  | "intake_received"
  | "ai_ready"
  | "reviewed"
  | "submitted"
  | "sold"
  | "archived";

export type AssetType = "photo" | "floor_plan" | "document";
export type AssetUploader = "realtor" | "homeowner";
export type NotificationType = "intake_submitted" | "ai_ready" | "mls_submitted";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          license_number: string | null;
          brokerage: string | null;
          phone: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_status: SubscriptionStatus | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          license_number?: string | null;
          brokerage?: string | null;
          phone?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: SubscriptionStatus | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      listings: {
        Row: {
          id: string;
          realtor_id: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          zip: string;
          price: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          sqft: number | null;
          lot_size: string | null;
          year_built: number | null;
          property_type: PropertyType | null;
          status: ListingStatus;
          intake_token: string;
          intake_sent_at: string | null;
          intake_completed_at: string | null;
          mls_number: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          realtor_id: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          zip: string;
          price?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          sqft?: number | null;
          lot_size?: string | null;
          year_built?: number | null;
          property_type?: PropertyType | null;
          status?: ListingStatus;
          intake_token?: string;
          intake_sent_at?: string | null;
          intake_completed_at?: string | null;
          mls_number?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      listing_details: {
        Row: {
          id: string;
          listing_id: string;
          highlights: string[] | null;
          recent_updates: string | null;
          neighborhood_notes: string | null;
          hoa_details: string | null;
          seller_notes: string | null;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id: string;
          highlights?: string[] | null;
          recent_updates?: string | null;
          neighborhood_notes?: string | null;
          hoa_details?: string | null;
          seller_notes?: string | null;
          submitted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["listing_details"]["Insert"]>;
      };
      listing_assets: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          asset_type: AssetType;
          sort_order: number;
          uploaded_by: AssetUploader;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          asset_type?: AssetType;
          sort_order?: number;
          uploaded_by: AssetUploader;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listing_assets"]["Insert"]>;
      };
      ai_outputs: {
        Row: {
          id: string;
          listing_id: string;
          version: number;
          listing_description: string | null;
          headline_variants: string[] | null;
          social_captions: {
            instagram?: string;
            facebook?: string;
            twitter?: string;
          } | null;
          generated_at: string;
          approved: boolean;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id: string;
          version?: number;
          listing_description?: string | null;
          headline_variants?: string[] | null;
          social_captions?: Json | null;
          generated_at?: string;
          approved?: boolean;
          approved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_outputs"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          realtor_id: string;
          listing_id: string | null;
          type: NotificationType;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          realtor_id: string;
          listing_id?: string | null;
          type: NotificationType;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}
