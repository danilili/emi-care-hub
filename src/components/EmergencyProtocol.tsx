import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle, CalendarCheck, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { UserConfig } from "@/hooks/useUserConfig";

// Protocolo de emergencia.
// V2 (therapist_config): emergency_mode + periodo + motivo + mensaje. Flujo en tres pasos:
//   1. Formulario → "Revisar antes de activar" consulta la VISTA PREVIA (webhook emergencia-v2-preview):
//      citas registradas del periodo, dudas (eventos del calendario sin cita registrada o sin contacto,
//      citas sin teléfono), el mensaje que recibirán y la fecha de reanudación. No cambia nada.
//   2. Advertencia final exclusiva: se van a cancelar N citas y enviar M mensajes (uno cada 10 min).
//   3. Solo al aceptar: se activa emergency_mode y se llama al webhook emergencia-v2 (cancela, avisa
//      espaciado y manda resumen a la terapeuta con las dudas que vio aquí).
// V1 (Configuracion_Clinica, Reyes legacy): se conserva tal cual.

const WEBHOOK_V1 = "https://reservalia.app.n8n.cloud/webhook/eb22d1c8-1805-47d1-b83e-490375e0f7db";
const WEBHOOK_V2 = (import.meta.env.VITE_N8N_WEBHOOK_EMERGENCIA_V2 as string | undefined)?.trim() || "";
const WEBHOOK_V2_PREVIEW =
  (import.meta.env.VITE_N8N_WEBHOOK_EMERGENCIA_V2_PREVIEW as string | undefined)?.trim() ||
  (WEBHOOK_V2 ? WEBHOOK_V2.replace(/\/emergencia-v2\/?$/, "/emergencia-v2-preview") : "");
const ID_INSTANCIA_V1 = "Reyes";
const MINUTOS_ENTRE_AVISOS = 10;

const DEFAULT_MESSAGE =
  "Por el momento el consultorio no está atendiendo. En cuanto se reanude la agenda te contactamos por este medio.";

interface EmergencyState {
  emergency_mode: boolean;
  emergency_message: string | null;
  emergency_return_date: string | null;
  emergency_reason: string | null;
  emergency_start_date: string | null;
  emergency_end_date: string | null;
}

export interface PreviewCita {
  appointment_id: string;
  external_event_id: string | null;
  fecha: string;
  hora: string;
  status: string;
  paciente: string;
  telefono: string | null;
  tiene_contacto: boolean;
}

export interface PreviewDuda {
  tipo: "evento_sin_cita" | "cita_sin_telefono";
  titulo: string;
  fecha: string;
  hora: string;
  tiene_contacto: boolean;
  detalle: string;
  telefono?: string;
  correo?: string;
  event_id?: string;
  appointment_id?: string;
}

export interface EmergencyPreview {
  periodo: { desde: string; hasta: string };
  citas: PreviewCita[];
  dudas: PreviewDuda[];
  calendario: { consultado: boolean; error: string | null; eventos_revisados: number };
  /** true cuando no se pudo consultar n8n y la lista salió solo de la base. */
  parcial: boolean;
}

function useEmergencyState(config: UserConfig | null | undefined) {
  return useQuery({
    queryKey: ["emergency-state", config?.stack, config?.id_cliente],
    enabled: Boolean(config?.id_cliente),
    queryFn: async (): Promise<EmergencyState | null> => {
      if (config!.stack === "v2") {
        const { data, error } = await (supabase as any)
          .from("therapist_config")
          .select("emergency_mode, emergency_message, emergency_return_date, emergency_reason, emergency_start_date, emergency_end_date")
          .eq("therapist_id", config!.id_cliente)
          .maybeSingle();
        if (error) throw error;
        return (data ?? null) as EmergencyState | null;
      }
      const { data, error } = await (supabase as any)
        .from("Configuracion_Clinica")
        .select("modo_emergencia, fecha_regreso_emergencia")
        .eq("id_instancia", ID_INSTANCIA_V1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        emergency_mode: Boolean(data.modo_emergencia),
        emergency_message: null,
        emergency_return_date: data.fecha_regreso_emergencia ?? null,
        emergency_reason: null,
        emergency_start_date: null,
        emergency_end_date: null,
      };
    },
  });
}

const fmtDate = (iso: string) => format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });
const fmtDayTime = (fecha: string, hora: string) => {
  try {
    return `${format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })} · ${hora.slice(0, 5)}`;
  } catch {
    return `${fecha} · ${hora}`;
  }
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Vista previa solo con la base (cuando n8n no responde): citas activas del periodo con su teléfono. */
async function previewFromSupabase(therapistId: string, desde: string, hasta: string): Promise<EmergencyPreview> {
  const { data, error } = await (supabase as any)
    .from("appointments")
    .select("id, external_event_id, appointment_date, start_time, status, patients(first_name, last_name, phone)")
    .eq("therapist_id", therapistId)
    .in("status", ["scheduled", "confirmed", "pending_confirmation"])
    .gte("appointment_date", desde)
    .lte("appointment_date", hasta)
    .order("appointment_date")
    .order("start_time");
  if (error) throw error;
  const citas: PreviewCita[] = (data ?? []).map((a: any) => {
    const p = a.patients ?? {};
    const digits = String(p.phone ?? "").replace(/\D/g, "");
    return {
      appointment_id: a.id,
      external_event_id: a.external_event_id ?? null,
      fecha: a.appointment_date,
      hora: String(a.start_time ?? "").slice(0, 5),
      status: a.status,
      paciente: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Paciente",
      telefono: p.phone ?? null,
      tiene_contacto: digits.length >= 10,
    };
  });
  const dudas: PreviewDuda[] = citas
    .filter((c) => !c.tiene_contacto)
    .map((c) => ({
      tipo: "cita_sin_telefono" as const,
      appointment_id: c.appointment_id,
      titulo: c.paciente,
      fecha: c.fecha,
      hora: c.hora,
      tiene_contacto: false,
      detalle: "cita registrada sin teléfono: se cancela pero no se puede avisar",
    }));
  return {
    periodo: { desde, hasta },
    citas,
    dudas,
    calendario: { consultado: false, error: "No se pudo consultar tu Google Calendar.", eventos_revisados: 0 },
    parcial: true,
  };
}

async function fetchPreview(
  therapistId: string,
  fechaInicio: string,
  fechaFin: string,
  fechaReanudacion: string,
): Promise<EmergencyPreview> {
  if (!WEBHOOK_V2_PREVIEW) return previewFromSupabase(therapistId, fechaInicio, fechaFin);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(WEBHOOK_V2_PREVIEW, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        therapist_id: therapistId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        fecha_reanudacion: fechaReanudacion,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`preview ${res.status}`);
    const json = await res.json();
    if (!json?.ok || !Array.isArray(json.citas)) throw new Error(json?.error || "preview inválida");
    return {
      periodo: json.periodo ?? { desde: fechaInicio, hasta: fechaFin },
      citas: json.citas,
      dudas: Array.isArray(json.dudas) ? json.dudas : [],
      calendario: json.calendario ?? { consultado: false, error: null, eventos_revisados: 0 },
      parcial: false,
    };
  } catch (err) {
    console.warn("[emergencia] vista previa n8n no disponible, usando solo la base", err);
    return previewFromSupabase(therapistId, fechaInicio, fechaFin);
  } finally {
    clearTimeout(timer);
  }
}

interface Props {
  config: UserConfig | null | undefined;
}

const EmergencyProtocol = ({ config }: Props) => {
  const queryClient = useQueryClient();
  const isV2 = config?.stack === "v2";
  const { data: state } = useEmergencyState(config);

  const active = state?.emergency_mode ?? false;

  const [motivo, setMotivo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaReanudacion, setFechaReanudacion] = useState("");
  const [mensaje, setMensaje] = useState(DEFAULT_MESSAGE);
  const [citasAfectadas, setCitasAfectadas] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<EmergencyPreview | null>(null);
  // Pasos del flujo V2: vista previa → advertencia final. V1 va directo a la advertencia.
  const [step, setStep] = useState<"none" | "preview" | "warning">("none");
  const [desactivarDialogOpen, setDesactivarDialogOpen] = useState(false);
  const [desactivando, setDesactivando] = useState(false);

  useEffect(() => {
    if (state?.emergency_message) setMensaje(state.emergency_message);
  }, [state?.emergency_message]);

  // Conteo rápido para el formulario (la vista previa trae el detalle).
  useEffect(() => {
    if (!isV2 || !config?.id_cliente || !fechaInicio || !fechaFin || fechaFin < fechaInicio) {
      setCitasAfectadas(null);
      return;
    }
    let cancelled = false;
    (supabase as any)
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("therapist_id", config.id_cliente)
      .in("status", ["scheduled", "confirmed", "pending_confirmation"])
      .gte("appointment_date", fechaInicio)
      .lte("appointment_date", fechaFin)
      .then(({ count }: { count: number | null }) => {
        if (!cancelled) setCitasAfectadas(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [isV2, config?.id_cliente, fechaInicio, fechaFin]);

  const isFormValid =
    motivo.trim() !== "" &&
    fechaInicio !== "" &&
    fechaFin !== "" &&
    fechaFin >= fechaInicio &&
    fechaReanudacion !== "" &&
    fechaReanudacion >= fechaFin &&
    (!isV2 || mensaje.trim() !== "");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["emergency-state"] });
    queryClient.invalidateQueries({ queryKey: ["citas-proximas"] });
    queryClient.invalidateQueries({ queryKey: ["citas-hoy"] });
  };

  const resetForm = () => {
    setMotivo("");
    setFechaInicio("");
    setFechaFin("");
    setFechaReanudacion("");
    setPreview(null);
    setStep("none");
  };

  const handleRevisar = async () => {
    if (!isFormValid) {
      toast.error("Completa todos los campos; las fechas deben ir en orden.");
      return;
    }
    if (!isV2) {
      setStep("warning");
      return;
    }
    if (!config?.id_cliente) return;
    setPreviewLoading(true);
    try {
      const p = await fetchPreview(config.id_cliente, fechaInicio, fechaFin, fechaReanudacion);
      setPreview(p);
      setStep("preview");
    } catch {
      toast.error("No se pudo preparar la vista previa. Intenta de nuevo.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const nCitas = preview?.citas.length ?? citasAfectadas ?? 0;
  const nAvisos = preview ? preview.citas.filter((c) => c.tiene_contacto).length : nCitas;
  const nDudas = preview?.dudas.length ?? 0;

  const handleConfirmActivar = async () => {
    if (!config?.id_cliente) return;
    setSending(true);
    try {
      if (isV2) {
        const { data, error } = await (supabase as any)
          .from("therapist_config")
          .update({
            emergency_mode: true,
            emergency_reason: motivo.trim(),
            emergency_start_date: fechaInicio,
            emergency_end_date: fechaFin,
            emergency_return_date: fechaReanudacion,
            emergency_message: mensaje.trim() || DEFAULT_MESSAGE,
            emergency_activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("therapist_id", config.id_cliente)
          .select("therapist_id");
        if (error || !data?.length) throw error ?? new Error("sin filas");

        if (WEBHOOK_V2) {
          // Cancela las citas del periodo en calendario y base, avisa a cada paciente (uno cada 10 min)
          // y manda a la terapeuta un resumen que incluye las dudas que vio en la vista previa.
          const res = await fetch(WEBHOOK_V2, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              therapist_id: config.id_cliente,
              motivo: motivo.trim(),
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
              fecha_reanudacion: fechaReanudacion,
              mensaje: mensaje.trim() || DEFAULT_MESSAGE,
              dudas: (preview?.dudas ?? []).map((d) => ({
                tipo: d.tipo,
                titulo: d.titulo,
                fecha: d.fecha,
                hora: d.hora,
                detalle: d.detalle,
              })),
              preview_parcial: preview?.parcial ?? true,
            }),
          });
          if (!res.ok) {
            toast.warning("El protocolo quedó activo, pero no se pudieron enviar los avisos. Revisa tus citas del periodo.");
          } else {
            toast.success(
              nAvisos > 0
                ? `Protocolo activado. Se avisará a ${plural(nAvisos, "paciente", "pacientes")}, con ${MINUTOS_ENTRE_AVISOS} minutos entre cada aviso.`
                : "Protocolo activado. No había pacientes a quienes avisar.",
            );
          }
        } else {
          toast.success("Protocolo activado: el asistente ya responde con tu mensaje y no agenda.");
        }
        resetForm();
        invalidate();
        return;
      }

      // V1 (legacy Reyes)
      const res = await fetch(WEBHOOK_V1, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: motivo.trim(),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          fecha_reagendamiento: fechaReanudacion,
        }),
      });
      if (!res.ok) throw new Error("webhook");
      toast.success("Protocolo activado con éxito");
      resetForm();
      invalidate();
    } catch {
      toast.error("No se pudo activar el protocolo. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleConfirmDesactivar = async () => {
    if (!config?.id_cliente) return;
    setDesactivando(true);
    try {
      if (isV2) {
        const { data, error } = await (supabase as any)
          .from("therapist_config")
          .update({
            emergency_mode: false,
            emergency_return_date: null,
            emergency_start_date: null,
            emergency_end_date: null,
            emergency_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("therapist_id", config.id_cliente)
          .select("therapist_id");
        if (error || !data?.length) throw error ?? new Error("sin filas");
      } else {
        const { error } = await (supabase as any)
          .from("Configuracion_Clinica")
          .update({ modo_emergencia: false, fecha_regreso_emergencia: null })
          .eq("id_instancia", ID_INSTANCIA_V1);
        if (error) throw error;
      }
      toast.success("Emergencia desactivada. La agenda vuelve a la normalidad.");
      setDesactivarDialogOpen(false);
      invalidate();
    } catch {
      toast.error("No se pudo desactivar. Intenta de nuevo.");
    } finally {
      setDesactivando(false);
    }
  };

  return (
    <>
      <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Protocolo de Emergencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {active && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm font-semibold text-destructive">Protocolo activo</span>
                <Badge variant="destructive" className="ml-auto text-xs">
                  EN EMERGENCIA
                </Badge>
              </div>
              {state?.emergency_reason && (
                <p className="text-sm text-muted-foreground">{state.emergency_reason}</p>
              )}
              {state?.emergency_start_date && state?.emergency_end_date && (
                <p className="text-sm text-muted-foreground">
                  Ausencia: {fmtDate(state.emergency_start_date)} – {fmtDate(state.emergency_end_date)}
                </p>
              )}
              {state?.emergency_return_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Reanudación:{" "}
                    <span className="font-medium text-foreground">{fmtDate(state.emergency_return_date)}</span>
                  </span>
                </div>
              )}
              {isV2 && state?.emergency_message && (
                <p className="rounded-md bg-background/60 p-2 text-xs text-muted-foreground">
                  Mensaje a los pacientes: “{state.emergency_message}”
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
                onClick={() => setDesactivarDialogOpen(true)}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Desactivar emergencia
              </Button>
            </div>
          )}

          {!active && (
            <>
              {isV2 && !WEBHOOK_V2 && (
                <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Los avisos automáticos a pacientes aún no están conectados en esta cuenta. Al activar, el asistente
                  dejará de agendar y responderá con tu mensaje, pero las citas del periodo tendrás que cancelarlas tú.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-xs font-medium text-muted-foreground">
                  Motivo de la ausencia
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Viaje de emergencia familiar"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="min-h-[72px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">Solo para tu registro; no se comparte con los pacientes.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio" className="text-xs font-medium text-muted-foreground">
                    Inicio de ausencia
                  </Label>
                  <Input id="fecha-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-fin" className="text-xs font-medium text-muted-foreground">
                    Fin de ausencia
                  </Label>
                  <Input id="fecha-fin" type="date" value={fechaFin} min={fechaInicio || undefined} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reanudacion" className="text-xs font-medium text-muted-foreground">
                  Fecha de reanudación
                </Label>
                <Input
                  id="reanudacion"
                  type="date"
                  value={fechaReanudacion}
                  min={fechaFin || undefined}
                  onChange={(e) => setFechaReanudacion(e.target.value)}
                />
              </div>

              {isV2 && (
                <div className="space-y-2">
                  <Label htmlFor="mensaje" className="text-xs font-medium text-muted-foreground">
                    Lo que responderá el asistente mientras dure la emergencia
                  </Label>
                  <Textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="min-h-[72px] resize-none"
                    maxLength={400}
                  />
                </div>
              )}

              {citasAfectadas !== null && (
                <p className="text-xs text-muted-foreground">
                  {citasAfectadas === 0
                    ? "No hay citas registradas en ese periodo."
                    : `${plural(citasAfectadas, "cita registrada", "citas registradas")} en ese periodo. Antes de activar verás el detalle y lo que hay en tu calendario.`}
                </p>
              )}

              <Button
                variant="destructive"
                className="w-full font-semibold"
                onClick={handleRevisar}
                disabled={sending || previewLoading}
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revisando tu agenda…
                  </>
                ) : isV2 ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Revisar antes de activar
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Activar Protocolo
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Paso 1 (V2): vista previa. Nada se ha cambiado todavía. */}
      <AlertDialog open={step === "preview"} onOpenChange={(open) => !open && setStep("none")}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Revisa antes de activar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Todavía no se ha cambiado nada. Esto es lo que pasará si continúas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {preview && (
            <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1 text-sm">
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
                <p>
                  <span className="text-muted-foreground">Ausencia:</span>{" "}
                  <span className="font-medium">
                    {fmtDate(fechaInicio)} – {fmtDate(fechaFin)}
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Se vuelve a agendar a partir del</span>{" "}
                  <span className="font-medium">{fmtDate(fechaReanudacion)}</span>
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold">
                  Citas que se van a cancelar ({preview.citas.length})
                </h4>
                {preview.citas.length === 0 ? (
                  <p className="text-muted-foreground">No hay citas registradas en ese periodo.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {preview.citas.map((c) => (
                      <li key={c.appointment_id} className="flex items-start justify-between gap-2 rounded-md border border-border p-2">
                        <div>
                          <p className="font-medium">{c.paciente}</p>
                          <p className="text-xs capitalize text-muted-foreground">{fmtDayTime(c.fecha, c.hora)}</p>
                        </div>
                        {c.tiene_contacto ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">se avisará</Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 border-amber-500/50 text-[10px] text-amber-700 dark:text-amber-400">
                            sin teléfono
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Para que revises tú ({preview.dudas.length})
                </h4>
                {!preview.calendario.consultado && (
                  <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                    {preview.calendario.error
                      ? `${preview.calendario.error} Solo se muestran las citas registradas; revisa tu calendario a mano.`
                      : "Esta cuenta no tiene un calendario conectado; solo se muestran las citas registradas."}
                  </p>
                )}
                {preview.dudas.length === 0 ? (
                  <p className="text-muted-foreground">
                    {preview.calendario.consultado
                      ? "Tu calendario no tiene eventos sin registrar en ese periodo y todas las citas tienen teléfono."
                      : "No hay citas registradas sin teléfono."}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {preview.dudas.map((d, i) => (
                      <li key={`${d.tipo}-${d.event_id ?? d.appointment_id ?? i}`} className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                        <p className="font-medium">{d.titulo}</p>
                        <p className="text-xs capitalize text-muted-foreground">{fmtDayTime(d.fecha, d.hora)}</p>
                        <p className="text-xs text-muted-foreground">{d.detalle}.</p>
                        {d.tiene_contacto && (d.telefono || d.correo) && (
                          <p className="text-xs text-muted-foreground">Contacto: {d.telefono || d.correo}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {preview.dudas.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Estas no se tocan en automático. Te las repito en el resumen por WhatsApp para que las resuelvas tú.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold">Mensaje que recibirá cada paciente</h4>
                <p className="rounded-md border border-border bg-muted/40 p-2 text-xs leading-relaxed">
                  Hola [nombre]. Por {motivo.trim().charAt(0).toLowerCase() + motivo.trim().slice(1)}, el consultorio no podrá
                  atender tu cita del [día] a las [hora]; queda cancelada. Una disculpa por el inconveniente. A partir del{" "}
                  {fmtDate(fechaReanudacion)} se puede volver a agendar por este medio.
                </p>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Los avisos salen uno por uno, con {MINUTOS_ENTRE_AVISOS} minutos entre pacientes, para no saturar tu WhatsApp.
                </p>
                <p className="text-xs text-muted-foreground">
                  Mientras dure la emergencia, a quien escriba se le responde: “{mensaje.trim() || DEFAULT_MESSAGE}”
                </p>
              </section>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <Button variant="destructive" onClick={() => setStep("warning")}>
              Continuar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paso 2: advertencia final. Solo aquí se activa. */}
      <AlertDialog open={step === "warning"} onOpenChange={(open) => !open && !sending && setStep(isV2 && preview ? "preview" : "none")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Activar el protocolo de emergencia?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {isV2 && WEBHOOK_V2 ? (
                <>
                  Se van a cancelar <strong className="text-foreground">{plural(nCitas, "cita", "citas")}</strong> y a enviar{" "}
                  <strong className="text-foreground">{plural(nAvisos, "mensaje", "mensajes")}</strong> a pacientes, uno cada{" "}
                  {MINUTOS_ENTRE_AVISOS} minutos.{" "}
                  {nDudas > 0 && <>{plural(nDudas, "pendiente queda", "pendientes quedan")} para que los revises tú. </>}
                  El asistente dejará de agendar y responderá con tu mensaje hasta el {fmtDate(fechaReanudacion)}.{" "}
                </>
              ) : isV2 ? (
                <>Desde ahora el asistente no agenda citas y responde con tu mensaje. Las citas del periodo no se cancelan solas en esta cuenta. </>
              ) : (
                <>Desde ahora el asistente no agenda citas. Se cancelarán las citas del periodo y se notificará a los pacientes por WhatsApp. </>
              )}
              <strong className="text-foreground">Esto no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>{isV2 && preview ? "Volver a la revisión" : "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmActivar();
              }}
              disabled={sending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activando…
                </>
              ) : isV2 && WEBHOOK_V2 && nAvisos > 0 ? (
                "Sí, cancelar y avisar"
              ) : (
                "Sí, activar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={desactivarDialogOpen} onOpenChange={setDesactivarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Desactivar protocolo de emergencia
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              La agenda vuelve a la normalidad y el asistente agenda de nuevo.{" "}
              <strong className="text-foreground">No se envían mensajes</strong> a los pacientes que ya fueron avisados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desactivando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDesactivar}
              disabled={desactivando}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {desactivando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desactivando…
                </>
              ) : (
                "Sí, desactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmergencyProtocol;
