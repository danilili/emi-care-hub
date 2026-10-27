import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle, CalendarCheck } from "lucide-react";
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
// V2 (therapist_config): emergency_mode + periodo + motivo + mensaje. Al activarlo el
// asistente deja de agendar y contesta emergency_message (resolve_tenant ya lo expone);
// las citas del periodo se cancelan y se avisa a los pacientes vía el webhook
// VITE_N8N_WEBHOOK_EMERGENCIA_V2 (si no está configurado, la tarjeta lo advierte).
// V1 (Configuracion_Clinica, Reyes legacy): se conserva tal cual.

const WEBHOOK_V1 = "https://reservalia.app.n8n.cloud/webhook/eb22d1c8-1805-47d1-b83e-490375e0f7db";
const WEBHOOK_V2 = (import.meta.env.VITE_N8N_WEBHOOK_EMERGENCIA_V2 as string | undefined)?.trim() || "";
const ID_INSTANCIA_V1 = "Reyes";

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
  const [activarDialogOpen, setActivarDialogOpen] = useState(false);
  const [desactivarDialogOpen, setDesactivarDialogOpen] = useState(false);
  const [desactivando, setDesactivando] = useState(false);

  useEffect(() => {
    if (state?.emergency_message) setMensaje(state.emergency_message);
  }, [state?.emergency_message]);

  // Cuenta las citas activas del periodo para que la confirmación diga cuántas se cancelan.
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
      .neq("status", "cancelled")
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
    setActivarDialogOpen(false);
  };

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
          // Cancela las citas del periodo en calendario y base, y avisa a cada paciente.
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
            }),
          });
          if (!res.ok) {
            toast.warning("El protocolo quedó activo, pero no se pudieron enviar los avisos. Revisa tus citas del periodo.");
          } else {
            toast.success("Protocolo activado. Se avisará a los pacientes del periodo.");
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
                    ? "No hay citas agendadas en ese periodo."
                    : `${citasAfectadas} ${citasAfectadas === 1 ? "cita agendada" : "citas agendadas"} en ese periodo.`}
                </p>
              )}

              <Button
                variant="destructive"
                className="w-full font-semibold"
                onClick={() => {
                  if (!isFormValid) {
                    toast.error("Completa todos los campos; las fechas deben ir en orden.");
                    return;
                  }
                  setActivarDialogOpen(true);
                }}
                disabled={sending}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Activar Protocolo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={activarDialogOpen} onOpenChange={setActivarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Activar protocolo de emergencia
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Desde ahora el asistente no agenda citas y responde con tu mensaje.{" "}
              {isV2 && WEBHOOK_V2 && citasAfectadas
                ? `Se cancelarán ${citasAfectadas} ${citasAfectadas === 1 ? "cita" : "citas"} del periodo y se avisará a cada paciente por WhatsApp. `
                : isV2 && !WEBHOOK_V2
                  ? "Las citas del periodo no se cancelan solas en esta cuenta. "
                  : "Se cancelarán las citas del periodo y se notificará a los pacientes por WhatsApp. "}
              <strong className="text-foreground">Esto no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivar}
              disabled={sending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activando…
                </>
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
