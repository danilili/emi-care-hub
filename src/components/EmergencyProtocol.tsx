import { useState } from "react";
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

const WEBHOOK_URL =
  "https://reservalia.app.n8n.cloud/webhook/eb22d1c8-1805-47d1-b83e-490375e0f7db";

const ID_INSTANCIA = "Reyes";

// ── Supabase hook ─────────────────────────────────────────────────────────────

function useClinicaConfig() {
  return useQuery({
    queryKey: ["clinica-config", ID_INSTANCIA],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("Configuracion_Clinica")
        .select("modo_emergencia, fecha_regreso_emergencia")
        .eq("id_instancia", ID_INSTANCIA)
        .maybeSingle();
      if (error) throw error;
      return data as { modo_emergencia: boolean; fecha_regreso_emergencia: string | null } | null;
    },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const EmergencyProtocol = () => {
  const queryClient = useQueryClient();
  const { data: clinicaConfig } = useClinicaConfig();

  const modoEmergencia = clinicaConfig?.modo_emergencia ?? false;
  const fechaRegreso = clinicaConfig?.fecha_regreso_emergencia ?? null;

  // ── Activar state ──
  const [motivo, setMotivo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaReagendamiento, setFechaReagendamiento] = useState("");
  const [sending, setSending] = useState(false);
  const [activarDialogOpen, setActivarDialogOpen] = useState(false);

  // ── Desactivar state ──
  const [desactivarDialogOpen, setDesactivarDialogOpen] = useState(false);
  const [desactivando, setDesactivando] = useState(false);

  const isFormValid =
    motivo.trim() !== "" &&
    fechaInicio !== "" &&
    fechaFin !== "" &&
    fechaReagendamiento !== "";

  const handleRequestActivation = () => {
    if (!isFormValid) {
      toast.error("Completa todos los campos antes de continuar");
      return;
    }
    setActivarDialogOpen(true);
  };

  const handleConfirmActivar = async () => {
    setSending(true);
    try {
      const body = {
        motivo: motivo.trim(),
        fecha_inicio: format(parseISO(fechaInicio), "yyyy-MM-dd"),
        fecha_fin: format(parseISO(fechaFin), "yyyy-MM-dd"),
        fecha_reagendamiento: format(parseISO(fechaReagendamiento), "yyyy-MM-dd"),
      };

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Protocolo activado con éxito");
        setMotivo("");
        setFechaInicio("");
        setFechaFin("");
        setFechaReagendamiento("");
        setActivarDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["clinica-config"] });
      } else {
        toast.error("Error del servidor. Intenta de nuevo.");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSending(false);
    }
  };

  const handleConfirmDesactivar = async () => {
    setDesactivando(true);
    try {
      const { error } = await (supabase as any)
        .from("Configuracion_Clinica")
        .update({ modo_emergencia: false, fecha_regreso_emergencia: null })
        .eq("id_instancia", ID_INSTANCIA);

      if (error) throw error;

      toast.success("Emergencia desactivada. La agenda vuelve a la normalidad.");
      setDesactivarDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinica-config"] });
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

          {/* ── Banner de emergencia activa ── */}
          {modoEmergencia && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm font-semibold text-destructive">
                  Protocolo activo
                </span>
                <Badge variant="destructive" className="ml-auto text-xs">
                  EN EMERGENCIA
                </Badge>
              </div>

              {fechaRegreso && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Reanudación:{" "}
                    <span className="font-medium text-foreground">
                      {format(parseISO(fechaRegreso), "d 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </span>
                </div>
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

          {/* ── Formulario de activación (solo si no hay emergencia activa) ── */}
          {!modoEmergencia && (
            <>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio" className="text-xs font-medium text-muted-foreground">
                    Inicio de ausencia
                  </Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-fin" className="text-xs font-medium text-muted-foreground">
                    Fin de ausencia
                  </Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reagendamiento" className="text-xs font-medium text-muted-foreground">
                  Fecha de reanudación
                </Label>
                <Input
                  id="reagendamiento"
                  type="date"
                  value={fechaReagendamiento}
                  onChange={(e) => setFechaReagendamiento(e.target.value)}
                />
              </div>

              <Button
                variant="destructive"
                className="w-full font-semibold"
                onClick={handleRequestActivation}
                disabled={sending}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Activar Protocolo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog: confirmar activación ── */}
      <AlertDialog open={activarDialogOpen} onOpenChange={setActivarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ ALERTA DE SEGURIDAD
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              ¿Estás seguro? Una vez que se activa el protocolo de emergencia{" "}
              <strong className="text-foreground">NO hay vuelta atrás</strong>. Se cancelarán todas
              las citas en este periodo y se notificará a los pacientes por WhatsApp
              automáticamente.
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
                "Sí, Activar Protocolo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: confirmar desactivación ── */}
      <AlertDialog open={desactivarDialogOpen} onOpenChange={setDesactivarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Desactivar protocolo de emergencia
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              ¿Estás seguro? Esto reactivará la agenda normal pero{" "}
              <strong className="text-foreground">
                NO enviará mensajes a los pacientes
              </strong>{" "}
              que fueron contactados previamente.
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
