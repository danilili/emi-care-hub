import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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

const WEBHOOK_URL =
  "https://reservalia.app.n8n.cloud/webhook-test/eb22d1c8-1805-47d1-b83e-490375e0f7db";

const EmergencyProtocol = () => {
  const [motivo, setMotivo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaReagendamiento, setFechaReagendamiento] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
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
        setDialogOpen(false);
      } else {
        toast.error("Error del servidor. Intenta de nuevo.");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSending(false);
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
        </CardContent>
      </Card>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              onClick={handleConfirm}
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
    </>
  );
};

export default EmergencyProtocol;
