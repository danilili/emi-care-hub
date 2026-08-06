import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserConfig } from "./useUserConfig";

export interface ResumenDiario {
  id_instancia: string | null;
  fecha: string | null;
  total_tareas_ia: number | null;
  minutos_ahorrados: number | null;
  dinero_gestionado: number | null;
}

export function useResumenDiario(config: UserConfig | null | undefined) {
  return useQuery({
    queryKey: ["resumen-diario", config?.stack, config?.id_cliente, config?.instancia_evolution],
    enabled: config?.stack === "v2" ? !!config?.id_cliente : !!config?.instancia_evolution,
    queryFn: async () => {
      if (config!.stack === "v2") {
        const { data, error } = await (supabase as any)
          .from("vista_resumen_diario_v2")
          .select("fecha, total_tareas_ia, minutos_ahorrados, dinero_gestionado")
          .eq("therapist_id", config!.id_cliente)
          .order("fecha", { ascending: true });

        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          id_instancia: null,
          ...r,
        })) as ResumenDiario[];
      }

      // V1 (Reyes, hasta el cutover)
      const { data, error } = await supabase
        .from("vista_resumen_diario")
        .select("*")
        .ilike("id_instancia", config!.instancia_evolution!)
        .order("fecha", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResumenDiario[];
    },
  });
}
