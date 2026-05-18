export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artist_submissions: {
        Row: {
          bandcamp: string | null
          based_city: string | null
          bio: string | null
          booking_email: string | null
          created_at: string
          festivals: string[]
          from_city: string | null
          genres: string[]
          id: string
          instagram: string | null
          labels: string | null
          manager_email: string | null
          members: string | null
          name: string
          notes: string | null
          photo_url: string | null
          soundcloud: string | null
          spotify: string | null
          status: string
          submitter_email: string
          submitter_role: string | null
          user_agent: string | null
          website: string | null
        }
        Insert: {
          bandcamp?: string | null
          based_city?: string | null
          bio?: string | null
          booking_email?: string | null
          created_at?: string
          festivals?: string[]
          from_city?: string | null
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          soundcloud?: string | null
          spotify?: string | null
          status?: string
          submitter_email: string
          submitter_role?: string | null
          user_agent?: string | null
          website?: string | null
        }
        Update: {
          bandcamp?: string | null
          based_city?: string | null
          bio?: string | null
          booking_email?: string | null
          created_at?: string
          festivals?: string[]
          from_city?: string | null
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          soundcloud?: string | null
          spotify?: string | null
          status?: string
          submitter_email?: string
          submitter_role?: string | null
          user_agent?: string | null
          website?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          available_cities: string[]
          bandcamp: string | null
          based_city: string | null
          bio: string | null
          booking_email: string | null
          claim_requested_at: string | null
          claimed_by: string | null
          created_at: string
          enriched_at: string | null
          enrichment_log: Json
          enrichment_status: string
          featured: boolean
          fee_currency: string
          fee_max_inr: number | null
          fee_min_inr: number | null
          festivals: string[]
          from_city: string | null
          gallery: Json
          genres: string[]
          id: string
          instagram: string | null
          labels: string | null
          manager_email: string | null
          members: string | null
          name: string
          open_to_bookings: boolean
          photo_url: string | null
          slug: string
          soundcloud: string | null
          source: string
          spotify: string | null
          status: string
          updated_at: string
          videos: Json
          website: string | null
          why: string | null
        }
        Insert: {
          available_cities?: string[]
          bandcamp?: string | null
          based_city?: string | null
          bio?: string | null
          booking_email?: string | null
          claim_requested_at?: string | null
          claimed_by?: string | null
          created_at?: string
          enriched_at?: string | null
          enrichment_log?: Json
          enrichment_status?: string
          featured?: boolean
          fee_currency?: string
          fee_max_inr?: number | null
          fee_min_inr?: number | null
          festivals?: string[]
          from_city?: string | null
          gallery?: Json
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name: string
          open_to_bookings?: boolean
          photo_url?: string | null
          slug: string
          soundcloud?: string | null
          source?: string
          spotify?: string | null
          status?: string
          updated_at?: string
          videos?: Json
          website?: string | null
          why?: string | null
        }
        Update: {
          available_cities?: string[]
          bandcamp?: string | null
          based_city?: string | null
          bio?: string | null
          booking_email?: string | null
          claim_requested_at?: string | null
          claimed_by?: string | null
          created_at?: string
          enriched_at?: string | null
          enrichment_log?: Json
          enrichment_status?: string
          featured?: boolean
          fee_currency?: string
          fee_max_inr?: number | null
          fee_min_inr?: number | null
          festivals?: string[]
          from_city?: string | null
          gallery?: Json
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name?: string
          open_to_bookings?: boolean
          photo_url?: string | null
          slug?: string
          soundcloud?: string | null
          source?: string
          spotify?: string | null
          status?: string
          updated_at?: string
          videos?: Json
          website?: string | null
          why?: string | null
        }
        Relationships: []
      }
      artist_dates: {
        Row: {
          artist_id: string
          city: string
          created_at: string
          created_by: string
          event_date: string
          event_time: string | null
          id: string
          is_public: boolean
          notes: string | null
          status: string
          ticket_url: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          artist_id: string
          city: string
          created_at?: string
          created_by?: string
          event_date: string
          event_time?: string | null
          id?: string
          is_public?: boolean
          notes?: string | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          artist_id?: string
          city?: string
          created_at?: string
          created_by?: string
          event_date?: string
          event_time?: string | null
          id?: string
          is_public?: boolean
          notes?: string | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_dates_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name: string
          photo_url?: string | null
          slug: string
          soundcloud?: string | null
          source?: string
          spotify?: string | null
          status?: string
          updated_at?: string
          videos?: Json
          website?: string | null
          why?: string | null
        }
        Update: {
          bandcamp?: string | null
          based_city?: string | null
          bio?: string | null
          booking_email?: string | null
          created_at?: string
          enriched_at?: string | null
          enrichment_log?: Json
          enrichment_status?: string
          featured?: boolean
          fee_currency?: string
          fee_max_inr?: number | null
          fee_min_inr?: number | null
          festivals?: string[]
          from_city?: string | null
          gallery?: Json
          genres?: string[]
          id?: string
          instagram?: string | null
          labels?: string | null
          manager_email?: string | null
          members?: string | null
          name?: string
          photo_url?: string | null
          slug?: string
          soundcloud?: string | null
          source?: string
          spotify?: string | null
          status?: string
          updated_at?: string
          videos?: Json
          website?: string | null
          why?: string | null
        }
        Relationships: []
      }
      booking_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          artist_id: string | null
          artist_name: string
          created_at: string
          forward_requested: boolean
          id: string
          ip_hash: string | null
          purpose: string | null
          requester_email: string
          requester_phone: string | null
          revealed_at: string | null
          user_agent: string | null
          verified_at: string | null
        }
        Insert: {
          artist_id?: string | null
          artist_name: string
          created_at?: string
          forward_requested?: boolean
          id?: string
          ip_hash?: string | null
          purpose?: string | null
          requester_email: string
          requester_phone?: string | null
          revealed_at?: string | null
          user_agent?: string | null
          verified_at?: string | null
        }
        Update: {
          artist_id?: string | null
          artist_name?: string
          created_at?: string
          forward_requested?: boolean
          id?: string
          ip_hash?: string | null
          purpose?: string | null
          requester_email?: string
          requester_phone?: string | null
          revealed_at?: string | null
          user_agent?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      curated_events: {
        Row: {
          blurb: string | null
          city: string | null
          created_at: string
          event_date: string | null
          event_time: string | null
          genre: Json
          id: string
          image_url: string | null
          is_featured: boolean
          source: string
          title: string
          updated_at: string
          url: string
          venue: string | null
        }
        Insert: {
          blurb?: string | null
          city?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          genre?: Json
          id?: string
          image_url?: string | null
          is_featured?: boolean
          source: string
          title: string
          updated_at?: string
          url: string
          venue?: string | null
        }
        Update: {
          blurb?: string | null
          city?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          genre?: Json
          id?: string
          image_url?: string | null
          is_featured?: boolean
          source?: string
          title?: string
          updated_at?: string
          url?: string
          venue?: string | null
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          email: string
          event_slug: string
          id: string
          name: string
          plus_ones: number
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_slug: string
          id?: string
          name: string
          plus_ones?: number
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_slug?: string
          id?: string
          name?: string
          plus_ones?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          blurb: string
          city: string
          created_at: string
          date: string
          id: string
          lineup: Json
          media: Json
          poster_url: string | null
          slug: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          blurb?: string
          city: string
          created_at?: string
          date: string
          id?: string
          lineup?: Json
          media?: Json
          poster_url?: string | null
          slug: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          blurb?: string
          city?: string
          created_at?: string
          date?: string
          id?: string
          lineup?: Json
          media?: Json
          poster_url?: string | null
          slug?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          blurb: string | null
          booking_email: string | null
          cities: string[]
          city: string | null
          crawl_urls: Json
          created_at: string
          genres: string[]
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          slug: string
          status: string
          trusted: boolean
          updated_at: string
          website: string | null
        }
        Insert: {
          blurb?: string | null
          booking_email?: string | null
          cities?: string[]
          city?: string | null
          crawl_urls?: Json
          created_at?: string
          genres?: string[]
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          slug: string
          status?: string
          trusted?: boolean
          updated_at?: string
          website?: string | null
        }
        Update: {
          blurb?: string | null
          booking_email?: string | null
          cities?: string[]
          city?: string | null
          crawl_urls?: Json
          created_at?: string
          genres?: string[]
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
          trusted?: boolean
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          backlinks: Json
          blog_posts: Json
          featured_playlist_id: string | null
          home_content: Json
          id: string
          marquees: Json
          playlists: Json
          seo_verifications: Json
          theme: Json
          updated_at: string
        }
        Insert: {
          backlinks?: Json
          blog_posts?: Json
          featured_playlist_id?: string | null
          home_content?: Json
          id: string
          marquees?: Json
          playlists?: Json
          seo_verifications?: Json
          theme?: Json
          updated_at?: string
        }
        Update: {
          backlinks?: Json
          blog_posts?: Json
          featured_playlist_id?: string | null
          home_content?: Json
          id?: string
          marquees?: Json
          playlists?: Json
          seo_verifications?: Json
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_videos: {
        Row: {
          created_at: string
          id: string
          is_featured: boolean
          published_at: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      verify_cron_secret: { Args: { _input: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
