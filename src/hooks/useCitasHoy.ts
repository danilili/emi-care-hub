import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { mapV2Cita, V2_CITA_SELECT, type Cita } from "./useCitasPendientes";
import type { UserConfig } from "./useUserConfig";

export function useCitasHoy(config: UserConfig | null | undefined) {
  const hoy = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["citas-hoy", config?.stack, config?.id_cliente, hoy],
    enabled: !!config?.id_cliente,
    queryFn: async () => {
      if (config!.stack === "v2") {
        const { data, error } = await (supabase as any)
          .from("appointments")
          .select(V2_CITA_SELECT)
          .eq("therapist_id", config!.id_cliente)
          .eq("appointment_date", hoy)
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
        .eq("fecha", hoy)
        .order("hora", { ascending: true });

      if (error) throw error;
      return data as Cita[];
    },
  });
}
