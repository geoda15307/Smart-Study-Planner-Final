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
      achievements: {
        Row: {
          achievement_key: string
          description: string
          icon: string
          id: string
          progress: number
          target: number
          title: string
          unlocked: boolean
          user_id: string
        }
        Insert: {
          achievement_key: string
          description: string
          icon: string
          id?: string
          progress?: number
          target: number
          title: string
          unlocked?: boolean
          user_id: string
        }
        Update: {
          achievement_key?: string
          description?: string
          icon?: string
          id?: string
          progress?: number
          target?: number
          title?: string
          unlocked?: boolean
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          request_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          request_count?: number
          usage_date: string
          user_id: string
        }
        Update: {
          request_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          activities: string[]
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          activities?: string[]
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          activities?: string[]
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          color: string
          course_name: string
          day: string
          end_time: string
          id: string
          room: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          color: string
          course_name: string
          day: string
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          color?: string
          course_name?: string
          day?: string
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          color: string
          created_at: string
          id: string
          lecturer_name: string | null
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          lecturer_name?: string | null
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          lecturer_name?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          ai_enabled: boolean
          dark_mode: boolean
          default_reminder: number
          language: string
          max_study_hours_per_day: number
          notification_enabled: boolean
          productive_time: string
          theme: string
          user_id: string
        }
        Insert: {
          ai_enabled?: boolean
          dark_mode?: boolean
          default_reminder?: number
          language?: string
          max_study_hours_per_day?: number
          notification_enabled?: boolean
          productive_time?: string
          theme?: string
          user_id: string
        }
        Update: {
          ai_enabled?: boolean
          dark_mode?: boolean
          default_reminder?: number
          language?: string
          max_study_hours_per_day?: number
          notification_enabled?: boolean
          productive_time?: string
          theme?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_premium: boolean
          major: string | null
          name: string
          semester: number | null
          university: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_premium?: boolean
          major?: string | null
          name: string
          semester?: number | null
          university?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_premium?: boolean
          major?: string | null
          name?: string
          semester?: number | null
          university?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          end_time: string
          id: string
          source: string
          start_time: string
          status: string
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          source: string
          start_time: string
          status?: string
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          source?: string
          start_time?: string
          status?: string
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          activity: string
          ai_analysis: Json | null
          category_id: string | null
          completed_at: string | null
          created_at: string
          deadline_date: string
          deadline_time: string
          description: string
          difficulty: string
          estimated_duration_minutes: number
          id: string
          notes: string | null
          priority: string
          priority_score: number
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: string
          ai_analysis?: Json | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_date: string
          deadline_time: string
          description?: string
          difficulty: string
          estimated_duration_minutes: number
          id?: string
          notes?: string | null
          priority: string
          priority_score?: number
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: string
          ai_analysis?: Json | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_date?: string
          deadline_time?: string
          description?: string
          difficulty?: string
          estimated_duration_minutes?: number
          id?: string
          notes?: string | null
          priority?: string
          priority_score?: number
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_preferences: {
        Row: {
          description: string
          enabled: boolean
          id: string
          name: string
          size: string
          user_id: string
          widget_key: string
        }
        Insert: {
          description: string
          enabled?: boolean
          id?: string
          name: string
          size: string
          user_id: string
          widget_key: string
        }
        Update: {
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          size?: string
          user_id?: string
          widget_key?: string
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
