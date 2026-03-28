import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumenDiario {
  id_instancia: string | null;
  fecha: string | null;
  total_tareas_ia: number | null;
  minutos_ahorrados: number | null;
  dinero_gestionado: number | null;
}

export function useResumenDiario(idInstancia: string) {
  return useQuery({
    queryKey: ["resumen-diario", idInstancia],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_resumen_diario")
        .select("*")
        .eq("id_instancia", idInstancia)
        .order("fecha", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResumenDiario[];
    },
    enabled: !!idInstancia,
  });
}
