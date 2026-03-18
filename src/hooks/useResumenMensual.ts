import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumenMensual {
  id_instancia: string | null;
  mes: string | null;
  total_tareas_ia: number | null;
  minutos_ahorrados: number | null;
  dinero_gestionado: number | null;
}

export function useResumenMensual(idInstancia: string) {
  return useQuery({
    queryKey: ["resumen-mensual", idInstancia],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_resumen_mensual")
        .select("*")
        .eq("id_instancia", idInstancia)
        .order("mes", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResumenMensual[];
    },
  });
}
