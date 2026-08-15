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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agency_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          agency_owner_id: string
          created_at: string
          custom_message: string | null
          email: string
          id: string
          invited_at: string
          status: string
          tier: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          agency_owner_id: string
          created_at?: string
          custom_message?: string | null
          email: string
          id?: string
          invited_at?: string
          status?: string
          tier: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          agency_owner_id?: string
          created_at?: string
          custom_message?: string | null
          email?: string
          id?: string
          invited_at?: string
          status?: string
          tier?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_invites_agency_owner_id_fkey"
            columns: ["agency_owner_id"]
            isOneToOne: false
            referencedRelation: "agency_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_owner_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          is_active: boolean
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_owner_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          is_active?: boolean
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_owner_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_owner_id_fkey"
            columns: ["agency_owner_id"]
            isOneToOne: false
            referencedRelation: "agency_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_owners: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          lite_quota: number
          lite_used: number
          max_quota: number
          max_used: number
          mini_quota: number
          mini_used: number
          notes: string | null
          pro_quota: number
          pro_used: number
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          lite_quota?: number
          lite_used?: number
          max_quota?: number
          max_used?: number
          mini_quota?: number
          mini_used?: number
          notes?: string | null
          pro_quota?: number
          pro_used?: number
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          lite_quota?: number
          lite_used?: number
          max_quota?: number
          max_used?: number
          mini_quota?: number
          mini_used?: number
          notes?: string | null
          pro_quota?: number
          pro_used?: number
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      agency_packages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_idr: number
          quota: number
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_idr: number
          quota: number
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_idr?: number
          quota?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_promos: {
        Row: {
          badge_text: string
          created_at: string
          description: string | null
          discount_percent: number
          ends_at: string
          id: string
          is_active: boolean
          starts_at: string
          target_tier: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          ends_at: string
          id?: string
          is_active?: boolean
          starts_at?: string
          target_tier?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          starts_at?: string
          target_tier?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      allowed_customers: {
        Row: {
          account_type: string
          claimed_at: string | null
          created_at: string | null
          email: string
          id: string
          is_claimed: boolean | null
          lynk_purchased_at: string | null
          name: string
          phone: string | null
          subscription_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string
          claimed_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_claimed?: boolean | null
          lynk_purchased_at?: string | null
          name: string
          phone?: string | null
          subscription_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string
          claimed_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_claimed?: boolean | null
          lynk_purchased_at?: string | null
          name?: string
          phone?: string | null
          subscription_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_history: {
        Row: {
          asesmen_data: Json | null
          bank_soal_data: Json | null
          content_schema_version: number
          created_at: string
          form_data: Json
          generation_result_v2: Json | null
          id: string
          kktp_data: Json | null
          lkpd_data: Json | null
          materi_data: Json | null
          modul_data: Json | null
          name: string
          prosem_data: Json | null
          prota_data: Json | null
          tindak_lanjut_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asesmen_data?: Json | null
          bank_soal_data?: Json | null
          content_schema_version?: number
          created_at?: string
          form_data?: Json
          generation_result_v2?: Json | null
          id?: string
          kktp_data?: Json | null
          lkpd_data?: Json | null
          materi_data?: Json | null
          modul_data?: Json | null
          name: string
          prosem_data?: Json | null
          prota_data?: Json | null
          tindak_lanjut_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asesmen_data?: Json | null
          bank_soal_data?: Json | null
          content_schema_version?: number
          created_at?: string
          form_data?: Json
          generation_result_v2?: Json | null
          id?: string
          kktp_data?: Json | null
          lkpd_data?: Json | null
          materi_data?: Json | null
          modul_data?: Json | null
          name?: string
          prosem_data?: Json | null
          prota_data?: Json | null
          tindak_lanjut_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          gemini_api_key: string | null
          id: string
          letterhead_url: string | null
          phone: string | null
          pollinations_api_key: string | null
          preferred_provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gemini_api_key?: string | null
          id?: string
          letterhead_url?: string | null
          phone?: string | null
          pollinations_api_key?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gemini_api_key?: string | null
          id?: string
          letterhead_url?: string | null
          phone?: string | null
          pollinations_api_key?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          provider: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          provider?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_agency_invite: {
        Args: { _custom_message?: string; _email: string; _tier: string }
        Returns: {
          accepted_at: string | null
          accepted_user_id: string | null
          agency_owner_id: string
          created_at: string
          custom_message: string | null
          email: string
          id: string
          invited_at: string
          status: string
          tier: string
          token: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "agency_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "agency_owner" | "agency_member"
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
    Enums: {
      app_role: ["admin", "user", "agency_owner", "agency_member"],
    },
  },
} as const
