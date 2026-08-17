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
  /** "v2" = tenant multi-tenant (therapists/therapist_config); "v1" = stack viejo (configuracion_maestra, Reyes hasta su cutover) */
  stack: "v1" | "v2";
}

export function useUserConfig() {
  return useQuery({
    queryKey: ["user-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Coexistencia legacy/V2 (misma regla que resolveAuthRedirect): mientras exista fila en
      // configuracion_maestra el usuario opera el stack viejo, aunque ya tenga tenant V2 creado
      // (Reyes tiene ambos durante la migración; el cutover es borrar/retirar su fila legacy).
      const { data: legacy } = await supabase
        .from("configuracion_maestra")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (legacy) return { ...legacy, stack: "v1" } as UserConfig;

      // ¿Tenant V2? (en el modelo V2, therapists.id === auth.uid(); RLS solo deja ver la fila propia)
      const { data: therapist } = await supabase
        .from("therapists")
        .select("id, first_name, last_name, brand_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (therapist?.id) {
        const { data: cfg } = await (supabase as any)
          .from("therapist_config")
          .select("evolution_instance, office_address, calendar_id, bot_enabled")
          .eq("therapist_id", therapist.id)
          .maybeSingle();

        return {
          id_cliente: therapist.id,
          nombre_doctor: `${therapist.first_name ?? ""} ${therapist.last_name ?? ""}`.trim() || null,
          nombre_comercial: therapist.brand_name ?? "Consultorio",
          plan_contratado: null,
          instancia_evolution: cfg?.evolution_instance ?? null,
          telefono_consultorio: therapist.phone ?? null,
          formato_cita: null,
          descripcion_servicios: null,
          domicilio_presencial: cfg?.office_address ?? null,
          google_calendar_id: cfg?.calendar_id ?? null,
          duracion_sesion: null,
          horarios_json: null,
          emi_active: cfg?.bot_enabled ?? null,
          stack: "v2",
        } as UserConfig;
      }

      return null;
    },
  });
}
