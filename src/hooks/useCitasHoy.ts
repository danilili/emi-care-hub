import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Cita } from "./useCitasPendientes";

export function useCitasHoy(idCliente: string | undefined) {
  const hoy = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["citas-hoy", idCliente, hoy],
    enabled: !!idCliente,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("citas")
        .select(
          "id, id_cliente, fecha, hora, dia, modalidad, status_cita, nombre_paciente, apellidos_paciente, telefono, status_paciente, id_cita_externo"
        )
        .eq("id_cliente", idCliente)
        .eq("fecha", hoy)
        .order("hora", { ascending: true });

      if (error) throw error;
      return data as Cita[];
    },
  });
}
