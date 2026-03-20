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
      Configuracion_Clinica: {
        Row: {
          bot_encendido: boolean | null
          fecha_regreso_emergencia: string | null
          horario_fin: string | null
          horario_inicio: string | null
          id_instancia: string
          modo_emergencia: boolean | null
          trabaja_24_7: boolean | null
        }
        Insert: {
          bot_encendido?: boolean | null
          fecha_regreso_emergencia?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id_instancia: string
          modo_emergencia?: boolean | null
          trabaja_24_7?: boolean | null
        }
        Update: {
          bot_encendido?: boolean | null
          fecha_regreso_emergencia?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id_instancia?: string
          modo_emergencia?: boolean | null
          trabaja_24_7?: boolean | null
        }
        Relationships: []
      }
      configuracion_maestra: {
        Row: {
          api_key_whatsapp: string | null
          created_at: string
          descripcion_servicios: string | null
          domicilio_presencial: string | null
          duracion_sesion: number | null
          emi_active: boolean | null
          fecha_inicio: string | null
          fecha_renovacion: string | null
          formato_cita: string | null
          google_calendar_id: string | null
          google_sheet_id: string | null
          horarios_json: Json | null
          id_cliente: string
          instancia_evolution: string | null
          link_videollamada: string | null
          nombre_comercial: string
          nombre_doctor: string | null
          perfil_paciente: string | null
          plan_contratado: string | null
          prompt_base: string | null
          protocolo_emergencia: boolean | null
          referido_por: string | null
          status_comercial: string | null
          telefono_consultorio: string | null
          tiempo_descanso: number | null
          user_id: string | null
        }
        Insert: {
          api_key_whatsapp?: string | null
          created_at?: string
          descripcion_servicios?: string | null
          domicilio_presencial?: string | null
          duracion_sesion?: number | null
          emi_active?: boolean | null
          fecha_inicio?: string | null
          fecha_renovacion?: string | null
          formato_cita?: string | null
          google_calendar_id?: string | null
          google_sheet_id?: string | null
          horarios_json?: Json | null
          id_cliente?: string
          instancia_evolution?: string | null
          link_videollamada?: string | null
          nombre_comercial: string
          nombre_doctor?: string | null
          perfil_paciente?: string | null
          plan_contratado?: string | null
          prompt_base?: string | null
          protocolo_emergencia?: boolean | null
          referido_por?: string | null
          status_comercial?: string | null
          telefono_consultorio?: string | null
          tiempo_descanso?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_whatsapp?: string | null
          created_at?: string
          descripcion_servicios?: string | null
          domicilio_presencial?: string | null
          duracion_sesion?: number | null
          emi_active?: boolean | null
          fecha_inicio?: string | null
          fecha_renovacion?: string | null
          formato_cita?: string | null
          google_calendar_id?: string | null
          google_sheet_id?: string | null
          horarios_json?: Json | null
          id_cliente?: string
          instancia_evolution?: string | null
          link_videollamada?: string | null
          nombre_comercial?: string
          nombre_doctor?: string | null
          perfil_paciente?: string | null
          plan_contratado?: string | null
          prompt_base?: string | null
          protocolo_emergencia?: boolean | null
          referido_por?: string | null
          status_comercial?: string | null
          telefono_consultorio?: string | null
          tiempo_descanso?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      Mensajes_Pendientes: {
        Row: {
          atendido: boolean | null
          created_at: string
          id: number
          mensaje: string | null
          nombre: string | null
          telefono: string | null
        }
        Insert: {
          atendido?: boolean | null
          created_at?: string
          id?: number
          mensaje?: string | null
          nombre?: string | null
          telefono?: string | null
        }
        Update: {
          atendido?: boolean | null
          created_at?: string
          id?: number
          mensaje?: string | null
          nombre?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      Metricas_Globales: {
        Row: {
          accion: string | null
          fecha_hora: string
          id: string
          id_instancia: string
          minutos_ahorrados: number
          monto_involucrado: number
          telefono_paciente: string | null
          turno: string | null
        }
        Insert: {
          accion?: string | null
          fecha_hora?: string
          id?: string
          id_instancia: string
          minutos_ahorrados?: number
          monto_involucrado?: number
          telefono_paciente?: string | null
          turno?: string | null
        }
        Update: {
          accion?: string | null
          fecha_hora?: string
          id?: string
          id_instancia?: string
          minutos_ahorrados?: number
          monto_involucrado?: number
          telefono_paciente?: string | null
          turno?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vista_resumen_diario: {
        Row: {
          dinero_gestionado: number | null
          fecha: string | null
          id_instancia: string | null
          minutos_ahorrados: number | null
          total_tareas_ia: number | null
        }
        Relationships: []
      }
      vista_resumen_mensual: {
        Row: {
          dinero_gestionado: number | null
          id_instancia: string | null
          mes: string | null
          minutos_ahorrados: number | null
          total_tareas_ia: number | null
        }
        Relationships: []
      }
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
