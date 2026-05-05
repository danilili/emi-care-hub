import { supabase } from "./client";

export type AuthRedirect = "onboarding" | "dashboard";

const UNIQUE_VIOLATION = "23505";

// Decides where to send a freshly-authenticated user and provisions the new-schema rows
// on first login post-confirmation. Honors the legacy/new coexistence: a user with a
// configuracion_maestra row keeps the old flow; everyone else is on the new schema.
export async function resolveAuthRedirect(
  userId: string,
  email: string,
): Promise<AuthRedirect> {
  const { data: legacy } = await supabase
    .from("configuracion_maestra")
    .select("id_cliente")
    .eq("user_id", userId)
    .maybeSingle();
  if (legacy) return "dashboard";

  const { data: existing } = await supabase
    .from("therapists")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    const { error: therapistErr } = await supabase.from("therapists").insert({
      id: userId,
      email,
      first_name: "",
      last_name: "",
      profession: "",
      brand_name: "",
    });
    if (therapistErr && therapistErr.code !== UNIQUE_VIOLATION) throw therapistErr;

    const { error: configErr } = await supabase.from("therapist_config").insert({
      therapist_id: userId,
      whatsapp_jid: `pending_wa_${userId}`,
      evolution_instance: `pending_evo_${userId}`,
    });
    if (configErr && configErr.code !== UNIQUE_VIOLATION) throw configErr;

    return "onboarding";
  }

  return existing.onboarding_completed_at ? "dashboard" : "onboarding";
}
