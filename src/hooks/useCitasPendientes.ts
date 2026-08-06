import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { UserConfig } from "./useUserConfig";

export interface Cita {
  id: string;
  id_cliente: string;
  fecha: string;
  hora: string;
  dia: string | null;
  modalidad: string | null;
  status_cita: string;
  nombre_paciente: string;
  apellidos_paciente: string | null;
  telefono: string;
  status_paciente: string | null;
  id_cita_externo: string | null;
}

// ── Mapeo V2 (appointments + patients) → forma Cita que ya consume la UI ─────

const STATUS_V2: Record<string, string> = {
  scheduled: "Agendado",
  pending_confirmation: "Por Confirmar",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export const V2_CITA_SELECT =
  "id, therapist_id, appointment_date, start_time, status, attendance, external_event_id, " +
  "patient:patients(first_name, last_name, phone), variant:service_variants(modality)";

export function mapV2Cita(r: any): Cita {
  return {
    id: r.id,
    id_cliente: r.therapist_id,
    fecha: r.appointment_date,
    hora: r.start_time ?? "00:00",
    dia: null,
    modalidad: r.variant
      ? r.variant.modality === "virtual"
        ? "Videollamada"
        : "Presencial"
      : null,
    status_cita: STATUS_V2[r.status] ?? r.status,
    nombre_paciente: r.patient?.first_name ?? "Paciente",
    apellidos_paciente: r.patient?.last_name ?? null,
    telefono: r.patient?.phone ?? "",
    status_paciente: null,
    id_cita_externo: r.external_event_id ?? null,
  };
}

// ── Citas pendientes de marcar asistencia ────────────────────────────────────

export function useCitasPendientes(config: UserConfig | null | undefined) {
  return useQuery({
    queryKey: ["citas-pendientes", config?.stack, config?.id_cliente],
    enabled: !!config?.id_cliente,
    queryFn: async () => {
      if (config!.stack === "v2") {
        // V2: citas pasadas o de hoy, no canceladas, sin asistencia marcada
        const hoy = format(new Date(), "yyyy-MM-dd");
        const { data, error } = await (supabase as any)
          .from("appointments")
          .select(V2_CITA_SELECT)
          .eq("therapist_id", config!.id_cliente)
          .is("attendance", null)
          .neq("status", "cancelled")
          .lte("appointment_date", hoy)
          .order("appointment_date", { ascending: false })
          .order("start_time", { ascending: true });

        if (error) throw error;
        return (data ?? []).map(mapV2Cita) as Cita[];
      }

      // V1 (Reyes, hasta el cutover)
      const { data, error } = await (supabase as any)
        .from("citas")
        .select(
          "id, id_cliente, fecha, hora, dia, modalidad, status_cita, nombre_paciente, apellidos_paciente, telefono, status_paciente, id_cita_externo"
        )
        .eq("id_cliente", config!.id_cliente)
        .is("asistencia", null)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: true });

      if (error) throw error;
      return data as Cita[];
    },
  });
}
