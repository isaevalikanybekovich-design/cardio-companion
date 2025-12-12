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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ecg_scans: {
        Row: {
          analysis_status: string | null
          created_at: string | null
          file_name: string
          file_type: string
          file_url: string
          final_analysis: Json | null
          gemini_result: Json | null
          id: string
          patient_id: string | null
          pm_cardio_result: Json | null
          user_id: string
        }
        Insert: {
          analysis_status?: string | null
          created_at?: string | null
          file_name: string
          file_type: string
          file_url: string
          final_analysis?: Json | null
          gemini_result?: Json | null
          id?: string
          patient_id?: string | null
          pm_cardio_result?: Json | null
          user_id: string
        }
        Update: {
          analysis_status?: string | null
          created_at?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          final_analysis?: Json | null
          gemini_result?: Json | null
          id?: string
          patient_id?: string | null
          pm_cardio_result?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecg_scans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_reports: {
        Row: {
          created_at: string | null
          ecg_scan_id: string
          id: string
          patient_id: string
          pdf_url: string | null
          recommendations: string | null
          report_text: string
          risk_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ecg_scan_id: string
          id?: string
          patient_id: string
          pdf_url?: string | null
          recommendations?: string | null
          report_text: string
          risk_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          ecg_scan_id?: string
          id?: string
          patient_id?: string
          pdf_url?: string | null
          recommendations?: string | null
          report_text?: string
          risk_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_reports_ecg_scan_id_fkey"
            columns: ["ecg_scan_id"]
            isOneToOne: false
            referencedRelation: "ecg_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number
          complaints_details: string | null
          created_at: string | null
          current_complaints: string[] | null
          gender: string
          height_cm: number
          id: string
          medical_history: string | null
          risk_factors: string[] | null
          updated_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          age: number
          complaints_details?: string | null
          created_at?: string | null
          current_complaints?: string[] | null
          gender: string
          height_cm: number
          id?: string
          medical_history?: string | null
          risk_factors?: string[] | null
          updated_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          age?: number
          complaints_details?: string | null
          created_at?: string | null
          current_complaints?: string[] | null
          gender?: string
          height_cm?: number
          id?: string
          medical_history?: string | null
          risk_factors?: string[] | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reference_data: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          unit: string | null
          updated_at: string
          user_id: string
          value_max: number | null
          value_min: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit?: string | null
          updated_at?: string
          user_id: string
          value_max?: number | null
          value_min?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value_max?: number | null
          value_min?: number | null
        }
        Relationships: []
      }
      voice_consultations: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question?: string
          user_id?: string
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
