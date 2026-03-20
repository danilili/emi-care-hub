import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserConfig {
  id_cliente: string;
  nombre_doctor: string | null;
  nombre_comercial: string;
  plan_contratado: string | null;
  instancia_evolution: string | null;
  telefono_consultorio: string | null;
  formato_cita: string | null;
  descripcion_servicios: string | null;
  domicilio_presencial: string | null;
  google_calendar_id: string | null;
  duracion_sesion: number | null;
  horarios_json: any;
  emi_active: boolean | null;
}

export function useUserConfig() {
  return useQuery({
    queryKey: ["user-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("configuracion_maestra")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserConfig | null;
    },
  });
}
