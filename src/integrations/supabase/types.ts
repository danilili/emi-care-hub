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
      appointments: {
        Row: {
          amount_charged: number | null
          appointment_date: string
          attendance: string | null
          attendance_marked_at: string | null
          cancellation_reason: string | null
          consultation_reason: string | null
          created_at: string
          end_time: string
          google_event_id: string | null
          id: string
          no_show_follow_up: string | null
          notes: string | null
          patient_id: string
          payment_type: string | null
          start_time: string
          status: string
          therapist_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          amount_charged?: number | null
          appointment_date: string
          attendance?: string | null
          attendance_marked_at?: string | null
          cancellation_reason?: string | null
          consultation_reason?: string | null
          created_at?: string
          end_time: string
          google_event_id?: string | null
          id?: string
          no_show_follow_up?: string | null
          notes?: string | null
          patient_id: string
          payment_type?: string | null
          start_time: string
          status?: string
          therapist_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          amount_charged?: number | null
          appointment_date?: string
          attendance?: string | null
          attendance_marked_at?: string | null
          cancellation_reason?: string | null
          consultation_reason?: string | null
          created_at?: string
          end_time?: string
          google_event_id?: string | null
          id?: string
          no_show_follow_up?: string | null
          notes?: string | null
          patient_id?: string
          payment_type?: string | null
          start_time?: string
          status?: string
          therapist_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "service_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      cabanas: {
        Row: {
          activa: boolean
          capacidad: number
          codigo_chapa: string | null
          created_at: string
          descripcion: string | null
          fotos_url: string[] | null
          id: string
          instrucciones_llegada: string | null
          nombre: string
          precio_base: number
          ubicacion_maps: string | null
          updated_at: string
          wifi_password: string | null
        }
        Insert: {
          activa?: boolean
          capacidad?: number
          codigo_chapa?: string | null
          created_at?: string
          descripcion?: string | null
          fotos_url?: string[] | null
          id?: string
          instrucciones_llegada?: string | null
          nombre: string
          precio_base: number
          ubicacion_maps?: string | null
          updated_at?: string
          wifi_password?: string | null
        }
        Update: {
          activa?: boolean
          capacidad?: number
          codigo_chapa?: string | null
          created_at?: string
          descripcion?: string | null
          fotos_url?: string[] | null
          id?: string
          instrucciones_llegada?: string | null
          nombre?: string
          precio_base?: number
          ubicacion_maps?: string | null
          updated_at?: string
          wifi_password?: string | null
        }
        Relationships: []
      }
      citas: {
        Row: {
          apellidos_paciente: string | null
          asistencia: string | null
          created_at: string
          dia: string | null
          fecha: string
          hora: string
          id: string
          id_cita_externo: string | null
          id_cliente: string | null
          ingreso: number | null
          modalidad: string | null
          monto_adeudo: number | null
          nombre_paciente: string
          pago: string | null
          seguimiento_adeudo: string | null
          seguimiento_noshow: string | null
          status_cita: string
          status_paciente: string | null
          telefono: string
          updated_at: string
        }
        Insert: {
          apellidos_paciente?: string | null
          asistencia?: string | null
          created_at?: string
          dia?: string | null
          fecha: string
          hora: string
          id?: string
          id_cita_externo?: string | null
          id_cliente?: string | null
          ingreso?: number | null
          modalidad?: string | null
          monto_adeudo?: number | null
          nombre_paciente: string
          pago?: string | null
          seguimiento_adeudo?: string | null
          seguimiento_noshow?: string | null
          status_cita?: string
          status_paciente?: string | null
          telefono: string
          updated_at?: string
        }
        Update: {
          apellidos_paciente?: string | null
          asistencia?: string | null
          created_at?: string
          dia?: string | null
          fecha?: string
          hora?: string
          id?: string
          id_cita_externo?: string | null
          id_cliente?: string | null
          ingreso?: number | null
          modalidad?: string | null
          monto_adeudo?: number | null
          nombre_paciente?: string
          pago?: string | null
          seguimiento_adeudo?: string | null
          seguimiento_noshow?: string | null
          status_cita?: string
          status_paciente?: string | null
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "configuracion_maestra"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      cola_mensajes: {
        Row: {
          created_at: string | null
          id: number
          mensaje_texto: string | null
          n8n_execution_id: string | null
          whatsapp_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          mensaje_texto?: string | null
          n8n_execution_id?: string | null
          whatsapp_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          mensaje_texto?: string | null
          n8n_execution_id?: string | null
          whatsapp_id?: string
        }
        Relationships: []
      }
      Configuracion_Clinica: {
        Row: {
          bot_encendido: boolean | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_regreso_emergencia: string | null
          horario_fin: string | null
          horario_inicio: string | null
          id_instancia: string
          modo_emergencia: boolean | null
          trabaja_24_7: boolean | null
        }
        Insert: {
          bot_encendido?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_regreso_emergencia?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id_instancia: string
          modo_emergencia?: boolean | null
          trabaja_24_7?: boolean | null
        }
        Update: {
          bot_encendido?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
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
          datos_fiscales: Json | null
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
          nombre_contacto: string
          nombre_doctor: string | null
          perfil_paciente: string | null
          plan_contratado: string | null
          prompt_base: string | null
          protocolo_emergencia: boolean | null
          referido_por: string | null
          status_comercial: string | null
          telefono_consultorio: string | null
          telefono_contacto: string
          telefono_emergencia: string | null
          tiempo_descanso: number | null
          timezone: string
          user_id: string | null
        }
        Insert: {
          api_key_whatsapp?: string | null
          created_at?: string
          datos_fiscales?: Json | null
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
          nombre_contacto?: string
          nombre_doctor?: string | null
          perfil_paciente?: string | null
          plan_contratado?: string | null
          prompt_base?: string | null
          protocolo_emergencia?: boolean | null
          referido_por?: string | null
          status_comercial?: string | null
          telefono_consultorio?: string | null
          telefono_contacto?: string
          telefono_emergencia?: string | null
          tiempo_descanso?: number | null
          timezone?: string
          user_id?: string | null
        }
        Update: {
          api_key_whatsapp?: string | null
          created_at?: string
          datos_fiscales?: Json | null
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
          nombre_contacto?: string
          nombre_doctor?: string | null
          perfil_paciente?: string | null
          plan_contratado?: string | null
          prompt_base?: string | null
          protocolo_emergencia?: boolean | null
          referido_por?: string | null
          status_comercial?: string | null
          telefono_consultorio?: string | null
          telefono_contacto?: string
          telefono_emergencia?: string | null
          tiempo_descanso?: number | null
          timezone?: string
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
      metrics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          therapist_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          therapist_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "metrics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          balance_due: number
          cancelled_count: number
          completed_count: number
          consultation_reason: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          first_visit_date: string | null
          id: string
          last_name: string | null
          last_visit_date: string | null
          no_show_count: number
          notes: string | null
          patient_timezone: string | null
          patient_type: string
          phone: string
          phone_country_code: string | null
          status: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          balance_due?: number
          cancelled_count?: number
          completed_count?: number
          consultation_reason?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          first_visit_date?: string | null
          id?: string
          last_name?: string | null
          last_visit_date?: string | null
          no_show_count?: number
          notes?: string | null
          patient_timezone?: string | null
          patient_type?: string
          phone: string
          phone_country_code?: string | null
          status?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          balance_due?: number
          cancelled_count?: number
          completed_count?: number
          consultation_reason?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          first_visit_date?: string | null
          id?: string
          last_name?: string | null
          last_visit_date?: string | null
          no_show_count?: number
          notes?: string | null
          patient_timezone?: string | null
          patient_type?: string
          phone?: string
          phone_country_code?: string | null
          status?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patients_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      service_variants: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          duration_minutes: number
          id: string
          modality: string
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          modality: string
          price: number
          service_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          modality?: string
          price?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "therapist_services"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_config: {
        Row: {
          booking_rules: Json | null
          bot_enabled: boolean
          calendar_id: string | null
          cancellation_policy: string | null
          custom_prompt_additions: string | null
          emergency_message: string | null
          emergency_mode: boolean
          emergency_return_date: string | null
          evolution_api_key: string | null
          evolution_instance: string
          fiscal_data: Json | null
          google_account_email: string | null
          google_refresh_token: string | null
          id: string
          office_address: string | null
          payment_methods: Json | null
          therapist_id: string
          timezone: string
          updated_at: string
          virtual_meeting_url: string | null
          whatsapp_jid: string
          works_24_7: boolean
        }
        Insert: {
          booking_rules?: Json | null
          bot_enabled?: boolean
          calendar_id?: string | null
          cancellation_policy?: string | null
          custom_prompt_additions?: string | null
          emergency_message?: string | null
          emergency_mode?: boolean
          emergency_return_date?: string | null
          evolution_api_key?: string | null
          evolution_instance: string
          fiscal_data?: Json | null
          google_account_email?: string | null
          google_refresh_token?: string | null
          id?: string
          office_address?: string | null
          payment_methods?: Json | null
          therapist_id: string
          timezone?: string
          updated_at?: string
          virtual_meeting_url?: string | null
          whatsapp_jid: string
          works_24_7?: boolean
        }
        Update: {
          booking_rules?: Json | null
          bot_enabled?: boolean
          calendar_id?: string | null
          cancellation_policy?: string | null
          custom_prompt_additions?: string | null
          emergency_message?: string | null
          emergency_mode?: boolean
          emergency_return_date?: string | null
          evolution_api_key?: string | null
          evolution_instance?: string
          fiscal_data?: Json | null
          google_account_email?: string | null
          google_refresh_token?: string | null
          id?: string
          office_address?: string | null
          payment_methods?: Json | null
          therapist_id?: string
          timezone?: string
          updated_at?: string
          virtual_meeting_url?: string | null
          whatsapp_jid?: string
          works_24_7?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "therapist_config_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_config_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_url: string
          id: string
          shareable: boolean
          therapist_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_url: string
          id?: string
          shareable?: boolean
          therapist_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_url?: string
          id?: string
          shareable?: boolean
          therapist_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_schedules: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          therapist_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          therapist_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_schedules_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_schedules_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          therapist_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          therapist_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapists: {
        Row: {
          bio: string | null
          brand_name: string
          created_at: string
          email: string
          first_name: string
          google_maps_url: string | null
          id: string
          last_name: string
          logo_url: string | null
          onboarding_completed_at: string | null
          phone: string | null
          profession: string
          status: string
          tone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          brand_name: string
          created_at?: string
          email: string
          first_name: string
          google_maps_url?: string | null
          id?: string
          last_name: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          profession: string
          status?: string
          tone?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          brand_name?: string
          created_at?: string
          email?: string
          first_name?: string
          google_maps_url?: string | null
          id?: string
          last_name?: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          profession?: string
          status?: string
          tone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      tenant_config: {
        Row: {
          bio: string | null
          booking_rules: Json | null
          bot_enabled: boolean | null
          brand_name: string | null
          calendar_id: string | null
          cancellation_policy: string | null
          custom_prompt_additions: string | null
          emergency_message: string | null
          emergency_mode: boolean | null
          emergency_return_date: string | null
          evolution_api_key: string | null
          evolution_instance: string | null
          first_name: string | null
          google_maps_url: string | null
          google_refresh_token: string | null
          last_name: string | null
          logo_url: string | null
          office_address: string | null
          profession: string | null
          therapist_id: string | null
          therapist_status: string | null
          timezone: string | null
          tone: string | null
          virtual_meeting_url: string | null
          website_url: string | null
          whatsapp_jid: string | null
          works_24_7: boolean | null
        }
        Relationships: []
      }
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
      get_active_appointments: {
        Args: { p_patient_id: string; p_therapist_id: string }
        Returns: {
          appointment_date: string
          appointment_id: string
          appointment_status: string
          end_time: string
          google_event_id: string
          service_name: string
          start_time: string
          variant_modality: string
          variant_price: number
        }[]
      }
      get_services_for_list: {
        Args: { p_therapist_id: string }
        Returns: {
          currency: string
          duration_minutes: number
          modality: string
          price: number
          service_description: string
          service_id: string
          service_name: string
          variant_id: string
        }[]
      }
      lookup_patient: {
        Args: { p_phone: string; p_therapist_id: string }
        Returns: {
          balance_due: number
          cancelled_count: number
          completed_count: number
          consultation_reason: string
          first_name: string
          first_visit_date: string
          last_name: string
          last_visit_date: string
          no_show_count: number
          patient_id: string
          patient_notes: string
          patient_status: string
          patient_timezone: string
          patient_type: string
        }[]
      }
      replace_therapist_schedules: {
        Args: { p_blocks: Json }
        Returns: undefined
      }
      replace_therapist_services: {
        Args: { p_services: Json }
        Returns: undefined
      }
      resolve_tenant: {
        Args: { p_instance_name: string }
        Returns: {
          bio: string
          bot_enabled: boolean
          brand_name: string
          calendar_id: string
          custom_prompt_additions: string
          emergency_message: string
          emergency_mode: boolean
          emergency_return_date: string
          evolution_api_key: string
          first_name: string
          google_refresh_token: string
          last_name: string
          logo_url: string
          office_address: string
          profession: string
          therapist_id: string
          therapist_status: string
          timezone: string
          tone: string
          virtual_meeting_url: string
          works_24_7: boolean
        }[]
      }
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
