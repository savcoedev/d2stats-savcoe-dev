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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      matches: {
        Row: {
          created_at: string
          duration: number
          game_mode: number
          game_mode_name: string | null
          hero_id: number | null
          hero_name: string | null
          id: string
          is_win: boolean | null
          match_id: number
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          game_mode: number
          game_mode_name?: string | null
          hero_id?: number | null
          hero_name?: string | null
          id?: string
          is_win?: boolean | null
          match_id: number
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          game_mode?: number
          game_mode_name?: string | null
          hero_id?: number | null
          hero_name?: string | null
          id?: string
          is_win?: boolean | null
          match_id?: number
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number | null
          combat_score: number | null
          created_at: string
          deaths: number | null
          denies: number | null
          duration: number | null
          game_mode: number
          game_mode_name: string | null
          gpm: number | null
          hero_damage: number | null
          hero_healing: number | null
          hero_id: number | null
          hero_name: string | null
          id: string
          is_win: boolean | null
          kills: number | null
          lane_role: number | null
          lane_role_name: string | null
          last_hits: number | null
          map_pressure_score: number | null
          match_id: number
          start_time: string | null
          survival_rate: number | null
          tower_damage: number | null
          user_id: string
          xpm: number | null
        }
        Insert: {
          assists?: number | null
          combat_score?: number | null
          created_at?: string
          deaths?: number | null
          denies?: number | null
          duration?: number | null
          game_mode: number
          game_mode_name?: string | null
          gpm?: number | null
          hero_damage?: number | null
          hero_healing?: number | null
          hero_id?: number | null
          hero_name?: string | null
          id?: string
          is_win?: boolean | null
          kills?: number | null
          lane_role?: number | null
          lane_role_name?: string | null
          last_hits?: number | null
          map_pressure_score?: number | null
          match_id: number
          start_time?: string | null
          survival_rate?: number | null
          tower_damage?: number | null
          user_id: string
          xpm?: number | null
        }
        Update: {
          assists?: number | null
          combat_score?: number | null
          created_at?: string
          deaths?: number | null
          denies?: number | null
          duration?: number | null
          game_mode?: number
          game_mode_name?: string | null
          gpm?: number | null
          hero_damage?: number | null
          hero_healing?: number | null
          hero_id?: number | null
          hero_name?: string | null
          id?: string
          is_win?: boolean | null
          kills?: number | null
          lane_role?: number | null
          lane_role_name?: string | null
          last_hits?: number | null
          map_pressure_score?: number | null
          match_id?: number
          start_time?: string | null
          survival_rate?: number | null
          tower_damage?: number | null
          user_id?: string
          xpm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_uid: string
          avatar_url: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          persona_name: string | null
          steam_id: string
          updated_at: string
        }
        Insert: {
          auth_uid: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          persona_name?: string | null
          steam_id: string
          updated_at?: string
        }
        Update: {
          auth_uid?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          persona_name?: string | null
          steam_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
