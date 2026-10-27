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
      agenda_import_staging: {
        Row: {
          aprobado: boolean | null
          candidates: string | null
          end_ts: string | null
          event_id: string
          match_type: string | null
          patient_id: string | null
          start_ts: string | null
          summary: string | null
        }
        Insert: {
          aprobado?: boolean | null
          candidates?: string | null
          end_ts?: string | null
          event_id: string
          match_type?: string | null
          patient_id?: string | null
          start_ts?: string | null
          summary?: string | null
        }
        Update: {
          aprobado?: boolean | null
          candidates?: string | null
          end_ts?: string | null
          event_id?: string
          match_type?: string | null
          patient_id?: string | null
          start_ts?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          amount_charged: number | null
          appointment_date: string
          attendance: string | null
          attendance_marked_at: string | null
          cancellation_reason: string | null
          consultation_reason: string | null
          created_at: string
          deposit_amount: number | null
          deposit_due_at: string | null
          deposit_status: string | null
          end_time: string
          external_event_id: string | null
          id: string
          intake_due_at: string | null
          intake_status: string | null
          intake_submitted_at: string | null
          is_first_visit: boolean | null
          no_show_follow_up: string | null
          notes: string | null
          paid_at: string | null
          paid_via: string | null
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
          deposit_amount?: number | null
          deposit_due_at?: string | null
          deposit_status?: string | null
          end_time: string
          external_event_id?: string | null
          id?: string
          intake_due_at?: string | null
          intake_status?: string | null
          intake_submitted_at?: string | null
          is_first_visit?: boolean | null
          no_show_follow_up?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_via?: string | null
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
          deposit_amount?: number | null
          deposit_due_at?: string | null
          deposit_status?: string | null
          end_time?: string
          external_event_id?: string | null
          id?: string
          intake_due_at?: string | null
          intake_status?: string | null
          intake_submitted_at?: string | null
          is_first_visit?: boolean | null
          no_show_follow_up?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_via?: string | null
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
      calendar_sweep_log: {
        Row: {
          appointment_id: string | null
          detail: string | null
          event_id: string
          event_start: string | null
          event_title: string | null
          id: string
          patient_id: string | null
          run_at: string
          status: string
          therapist_id: string
        }
        Insert: {
          appointment_id?: string | null
          detail?: string | null
          event_id: string
          event_start?: string | null
          event_title?: string | null
          id?: string
          patient_id?: string | null
          run_at?: string
          status: string
          therapist_id: string
        }
        Update: {
          appointment_id?: string | null
          detail?: string | null
          event_id?: string
          event_start?: string | null
          event_title?: string | null
          id?: string
          patient_id?: string | null
          run_at?: string
          status?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sweep_log_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "calendar_sweep_log_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
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
      Configuracion_Clinica: {
        Row: {
          bot_encendido: boolean | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_regreso_emergencia: string | null
          footer_capacitacion: string | null
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
          footer_capacitacion?: string | null
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
          footer_capacitacion?: string | null
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
      consultorio_messages: {
        Row: {
          created_at: string
          id: string
          phone: string
          source: string
          texto: string
          therapist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          source?: string
          texto: string
          therapist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          source?: string
          texto?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultorio_messages_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "consultorio_messages_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_log: {
        Row: {
          actor: string
          agent: string | null
          appointment_id: string | null
          channel: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          phone: string
          source: string | null
          texto: string | null
          therapist_id: string
        }
        Insert: {
          actor: string
          agent?: string | null
          appointment_id?: string | null
          channel?: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          phone: string
          source?: string | null
          texto?: string | null
          therapist_id: string
        }
        Update: {
          actor?: string
          agent?: string | null
          appointment_id?: string | null
          channel?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          phone?: string
          source?: string | null
          texto?: string | null
          therapist_id?: string
        }
        Relationships: []
      }
      emi_global_config: {
        Row: {
          key: string
          notes: string | null
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          notes?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          notes?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      emi_review_journal: {
        Row: {
          content: string
          key: string
          updated_at: string
        }
        Insert: {
          content: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      emi_value_weights: {
        Row: {
          descripcion: string | null
          event_type: string
          minutos: number
          minutos_sistema: number
          minutos_terapeuta: number | null
          updated_at: string
        }
        Insert: {
          descripcion?: string | null
          event_type: string
          minutos?: number
          minutos_sistema?: number
          minutos_terapeuta?: number | null
          updated_at?: string
        }
        Update: {
          descripcion?: string | null
          event_type?: string
          minutos?: number
          minutos_sistema?: number
          minutos_terapeuta?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ignored_messages: {
        Row: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message_text: string | null
          motivo: string
          notified_at: string | null
          phone: string
          push_name: string | null
          replay_log_id: string | null
          replayed_at: string | null
          therapist_id: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message_text?: string | null
          motivo?: string
          notified_at?: string | null
          phone: string
          push_name?: string | null
          replay_log_id?: string | null
          replayed_at?: string | null
          therapist_id: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message_text?: string | null
          motivo?: string
          notified_at?: string | null
          phone?: string
          push_name?: string | null
          replay_log_id?: string | null
          replayed_at?: string | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ignored_messages_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ignored_messages_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
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
          exclude_from_bot: boolean
          first_name: string
          first_visit_date: string | null
          guardian_name: string | null
          id: string
          is_minor: boolean
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
          exclude_from_bot?: boolean
          first_name: string
          first_visit_date?: string | null
          guardian_name?: string | null
          id?: string
          is_minor?: boolean
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
          exclude_from_bot?: boolean
          first_name?: string
          first_visit_date?: string | null
          guardian_name?: string | null
          id?: string
          is_minor?: boolean
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
      payment_submissions: {
        Row: {
          amount_reported: number | null
          created_at: string
          id: string
          patient_id: string
          proof_url: string | null
          reviewed_at: string | null
          reviewed_note: string | null
          status: string
          therapist_id: string
        }
        Insert: {
          amount_reported?: number | null
          created_at?: string
          id?: string
          patient_id: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_note?: string | null
          status?: string
          therapist_id: string
        }
        Update: {
          amount_reported?: number | null
          created_at?: string
          id?: string
          patient_id?: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_note?: string | null
          status?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "payment_submissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_messages: {
        Row: {
          apikey: string
          attempts: number
          chat_id: string
          created_at: string
          delivered_at: string | null
          id: string
          instance: string
          last_error: string | null
          max_attempts: number
          message_text: string
          status: string
          updated_at: string
          url_server: string
        }
        Insert: {
          apikey: string
          attempts?: number
          chat_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          instance: string
          last_error?: string | null
          max_attempts?: number
          message_text: string
          status?: string
          updated_at?: string
          url_server: string
        }
        Update: {
          apikey?: string
          attempts?: number
          chat_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          instance?: string
          last_error?: string | null
          max_attempts?: number
          message_text?: string
          status?: string
          updated_at?: string
          url_server?: string
        }
        Relationships: []
      }
      replay_log: {
        Row: {
          apology_sent_at: string | null
          batch_id: string | null
          created_at: string
          emi_reply: string | null
          error: string | null
          id: string
          ignored_ids: string[] | null
          original_at: string | null
          original_text: string | null
          patient_id: string | null
          patient_name: string | null
          phone: string
          raw_phone: string | null
          replayed_at: string | null
          reply_at: string | null
          status: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          apology_sent_at?: string | null
          batch_id?: string | null
          created_at?: string
          emi_reply?: string | null
          error?: string | null
          id?: string
          ignored_ids?: string[] | null
          original_at?: string | null
          original_text?: string | null
          patient_id?: string | null
          patient_name?: string | null
          phone: string
          raw_phone?: string | null
          replayed_at?: string | null
          reply_at?: string | null
          status?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          apology_sent_at?: string | null
          batch_id?: string | null
          created_at?: string
          emi_reply?: string | null
          error?: string | null
          id?: string
          ignored_ids?: string[] | null
          original_at?: string | null
          original_text?: string | null
          patient_id?: string | null
          patient_name?: string | null
          phone?: string
          raw_phone?: string | null
          replayed_at?: string | null
          reply_at?: string | null
          status?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replay_log_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "replay_log_therapist_id_fkey"
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
      tenant_send_slots: {
        Row: {
          channel: string
          next_slot: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          channel?: string
          next_slot?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          next_slot?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_send_slots_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "tenant_send_slots_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_config: {
        Row: {
          appointment_policies: Json
          availability_calendar_ids: string[]
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_clabe: string | null
          bank_name: string | null
          booking_rules: Json | null
          bot_enabled: boolean
          calendar_id: string | null
          calendar_sweep_enabled: boolean
          cancellation_policy: string | null
          companions_note: string | null
          companions_policy: string
          crisis_alert_phone: string | null
          crisis_alerts_enabled: boolean
          crisis_resources: string | null
          custom_prompt_additions: string | null
          deposit_amount: number | null
          deposit_applies_to: string
          deposit_deadline_days: number | null
          deposit_mode: string
          deposit_percent: number | null
          emergency_message: string | null
          emergency_mode: boolean
          emergency_return_date: string | null
          emotional_guidelines: string | null
          evolution_api_key: string | null
          evolution_instance: string
          evolution_url: string | null
          exclusion_list_enabled: boolean
          first_visit_min_hours_advance: number | null
          fiscal_data: Json | null
          footer_text: string | null
          google_account_email: string | null
          google_refresh_token: string | null
          id: string
          intake_form_deadline_days: number | null
          intake_form_required: boolean
          intake_form_url: string | null
          intake_mode: string
          intake_question_required: boolean
          intake_question_text: string | null
          notify_owner_bookings: boolean
          office_address: string | null
          only_known_patients: boolean
          payment_methods: Json | null
          reminders_enabled: boolean
          therapist_alias: string | null
          therapist_id: string
          timezone: string
          updated_at: string
          virtual_meeting_url: string | null
          whatsapp_jid: string
          works_24_7: boolean
        }
        Insert: {
          appointment_policies?: Json
          availability_calendar_ids?: string[]
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_clabe?: string | null
          bank_name?: string | null
          booking_rules?: Json | null
          bot_enabled?: boolean
          calendar_id?: string | null
          calendar_sweep_enabled?: boolean
          cancellation_policy?: string | null
          companions_note?: string | null
          companions_policy?: string
          crisis_alert_phone?: string | null
          crisis_alerts_enabled?: boolean
          crisis_resources?: string | null
          custom_prompt_additions?: string | null
          deposit_amount?: number | null
          deposit_applies_to?: string
          deposit_deadline_days?: number | null
          deposit_mode?: string
          deposit_percent?: number | null
          emergency_message?: string | null
          emergency_mode?: boolean
          emergency_return_date?: string | null
          emotional_guidelines?: string | null
          evolution_api_key?: string | null
          evolution_instance: string
          evolution_url?: string | null
          exclusion_list_enabled?: boolean
          first_visit_min_hours_advance?: number | null
          fiscal_data?: Json | null
          footer_text?: string | null
          google_account_email?: string | null
          google_refresh_token?: string | null
          id?: string
          intake_form_deadline_days?: number | null
          intake_form_required?: boolean
          intake_form_url?: string | null
          intake_mode?: string
          intake_question_required?: boolean
          intake_question_text?: string | null
          notify_owner_bookings?: boolean
          office_address?: string | null
          only_known_patients?: boolean
          payment_methods?: Json | null
          reminders_enabled?: boolean
          therapist_alias?: string | null
          therapist_id: string
          timezone?: string
          updated_at?: string
          virtual_meeting_url?: string | null
          whatsapp_jid: string
          works_24_7?: boolean
        }
        Update: {
          appointment_policies?: Json
          availability_calendar_ids?: string[]
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_clabe?: string | null
          bank_name?: string | null
          booking_rules?: Json | null
          bot_enabled?: boolean
          calendar_id?: string | null
          calendar_sweep_enabled?: boolean
          cancellation_policy?: string | null
          companions_note?: string | null
          companions_policy?: string
          crisis_alert_phone?: string | null
          crisis_alerts_enabled?: boolean
          crisis_resources?: string | null
          custom_prompt_additions?: string | null
          deposit_amount?: number | null
          deposit_applies_to?: string
          deposit_deadline_days?: number | null
          deposit_mode?: string
          deposit_percent?: number | null
          emergency_message?: string | null
          emergency_mode?: boolean
          emergency_return_date?: string | null
          emotional_guidelines?: string | null
          evolution_api_key?: string | null
          evolution_instance?: string
          evolution_url?: string | null
          exclusion_list_enabled?: boolean
          first_visit_min_hours_advance?: number | null
          fiscal_data?: Json | null
          footer_text?: string | null
          google_account_email?: string | null
          google_refresh_token?: string | null
          id?: string
          intake_form_deadline_days?: number | null
          intake_form_required?: boolean
          intake_form_url?: string | null
          intake_mode?: string
          intake_question_required?: boolean
          intake_question_text?: string | null
          notify_owner_bookings?: boolean
          office_address?: string | null
          only_known_patients?: boolean
          payment_methods?: Json | null
          reminders_enabled?: boolean
          therapist_alias?: string | null
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
      therapist_notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          patient_phone: string | null
          texto: string
          therapist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          patient_phone?: string | null
          texto: string
          therapist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          patient_phone?: string | null
          texto?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_notifications_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "tenant_config"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_notifications_therapist_id_fkey"
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
          modality: string | null
          service_id: string | null
          start_time: string
          therapist_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          modality?: string | null
          service_id?: string | null
          start_time: string
          therapist_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          modality?: string | null
          service_id?: string | null
          start_time?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_schedules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "therapist_services"
            referencedColumns: ["id"]
          },
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
          applies_to: string
          audience_excludes: string | null
          audience_includes: string | null
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
          applies_to?: string
          audience_excludes?: string | null
          audience_includes?: string | null
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
          applies_to?: string
          audience_excludes?: string | null
          audience_includes?: string | null
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
          site_slug: string | null
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
          site_slug?: string | null
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
          site_slug?: string | null
          status?: string
          tone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      unresolved_webhooks: {
        Row: {
          evolution_instance: string | null
          id: string
          payload: Json | null
          reason: string | null
          received_at: string | null
          whatsapp_jid: string | null
        }
        Insert: {
          evolution_instance?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
          received_at?: string | null
          whatsapp_jid?: string | null
        }
        Update: {
          evolution_instance?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
          received_at?: string | null
          whatsapp_jid?: string | null
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
      vista_resumen_diario_v2: {
        Row: {
          dinero_gestionado: number | null
          fecha: string | null
          minutos_ahorrados: number | null
          therapist_id: string | null
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
      vista_valor_emi_diaria: {
        Row: {
          citas_cobradas: number | null
          cobrado: number | null
          fecha: string | null
          minutos_ahorrados: number | null
          tareas: number | null
          therapist_id: string | null
        }
        Relationships: []
      }
      vista_valor_emi_eventos: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          created_by: string | null
          event_type: string | null
          fuente: string | null
          id: string | null
          minutos: number | null
          therapist_id: string | null
        }
        Relationships: []
      }
      vista_valor_emi_mensual: {
        Row: {
          adeudo_pendiente: number | null
          atendidas_sin_cobro: number | null
          citas_atendidas: number | null
          citas_cobradas: number | null
          cobrado_en_mes: number | null
          horas_ahorradas: number | null
          ingresos_cobrados: number | null
          mes: string | null
          minutos_ahorrados: number | null
          tareas: number | null
          tenant: string | null
          therapist_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_payment: {
        Args: { p: Json }
        Returns: {
          cleared: boolean
          patient_id: string
        }[]
      }
      book_appointment: {
        Args: { p: Json }
        Returns: {
          appointment_id: string
          patient_id: string
          variant_id: string
        }[]
      }
      cancel_appointment: {
        Args: { p: Json }
        Returns: {
          appointment_id: string
          cancelled: boolean
          external_event_id: string
        }[]
      }
      change_appointment_modality: {
        Args: { p: Json }
        Returns: {
          appointment_id: string
          blocked_reason: string
          changed: boolean
          external_event_id: string
          modality: string
          variant_id: string
        }[]
      }
      cleanup_qa_cobranza: {
        Args: { p_marker: string; p_therapist_id: string }
        Returns: Json
      }
      confirm_appointment: {
        Args: { p: Json }
        Returns: {
          appointment_id: string
          confirmed: boolean
        }[]
      }
      dismiss_ignored_messages: { Args: { p_ids: string[] }; Returns: number }
      emi_review_journal_patch: {
        Args: {
          p_append?: string
          p_find?: string
          p_key: string
          p_replace?: string
        }
        Returns: number
      }
      get_active_appointments: {
        Args: { p_patient_id: string; p_therapist_id: string }
        Returns: {
          appointment_date: string
          appointment_id: string
          appointment_status: string
          end_time: string
          external_event_id: string
          service_name: string
          start_time: string
          variant_modality: string
          variant_price: number
        }[]
      }
      get_resumable_conversations: {
        Args: { p_hours?: number; p_therapist_id: string }
        Returns: {
          first_at: string
          ignored_ids: string[]
          last_at: string
          luz_replied: boolean
          luz_thread: boolean
          messages: Json
          patient_id: string
          patient_name: string
          phone: string
          raw_phone: string
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
          email: string
          exclude_from_bot: boolean
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
      mark_attendance_v2: {
        Args: {
          p_amount?: number
          p_appointment_id: string
          p_attendance: string
          p_debt_amount?: number
          p_payment_label?: string
          p_payment_type?: string
          p_variant_id?: string
        }
        Returns: undefined
      }
      merge_patients: {
        Args: { p_keep: string; p_note?: string; p_remove: string }
        Returns: Json
      }
      register_patient: {
        Args: { p: Json }
        Returns: {
          created: boolean
          patient_id: string
        }[]
      }
      reject_payment: {
        Args: { p: Json }
        Returns: {
          rejected: boolean
          submission_id: string
        }[]
      }
      render_appointment_policies: {
        Args: { p: Json; p_alias: string }
        Returns: string
      }
      replace_therapist_schedules: {
        Args: { p_blocks: Json }
        Returns: undefined
      }
      replace_therapist_services: {
        Args: { p_services: Json }
        Returns: undefined
      }
      reschedule_appointment: {
        Args: { p: Json }
        Returns: {
          appointment_id: string
          external_event_id: string
          rescheduled: boolean
        }[]
      }
      reserve_send_slot: {
        Args: {
          p_channel?: string
          p_gap_seconds?: number
          p_therapist_id: string
        }
        Returns: string
      }
      resolve_tenant: {
        Args: { p_instance_name: string }
        Returns: {
          appointment_policies: string
          appointment_policies_text: string
          bio: string
          bot_enabled: boolean
          brand_name: string
          calendar_id: string
          crisis_alert_phone: string
          crisis_resources: string
          custom_prompt_additions: string
          emergency_message: string
          emergency_mode: boolean
          emergency_return_date: string
          emotional_guidelines: string
          evolution_api_key: string
          exclusion_list_enabled: boolean
          first_name: string
          google_refresh_token: string
          last_name: string
          logo_url: string
          office_address: string
          only_known_patients: boolean
          owner_phone: string
          payment_methods: string
          profession: string
          reminders_enabled: boolean
          therapist_alias: string
          therapist_id: string
          therapist_status: string
          timezone: string
          tone: string
          virtual_meeting_url: string
          works_24_7: boolean
        }[]
      }
      silent_confirm_excluded: {
        Args: {
          p_motivo?: string
          p_phone10: string
          p_text: string
          p_therapist_id: string
        }
        Returns: Json
      }
      sitio_publico: { Args: { p_slug: string }; Returns: Json }
      submit_payment_proof: {
        Args: { p: Json }
        Returns: {
          submission_id: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
