import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useCitasPendientes(idCliente: string | undefined) {
  return useQuery({
    queryKey: ["citas-pendientes", idCliente],
    enabled: !!idCliente,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("citas")
        .select(
          "id, id_cliente, fecha, hora, dia, modalidad, status_cita, nombre_paciente, apellidos_paciente, telefono, status_paciente, id_cita_externo"
        )
        .eq("id_cliente", idCliente)
        .is("asistencia", null)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: true });

      if (error) throw error;
      return data as Cita[];
    },
  });
}
