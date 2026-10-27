import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Cita } from "@/hooks/useCitasPendientes";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatMXN } from "@/lib/firstVisitRules";

// Ficha de cita (solo V2). La app solo cambia deposit_status e intake_status;
// montos y plazos los calcula el trigger de la base.

export type RuleStatus = "pending" | "received" | "waived";

export const RULE_STATUS_LABEL: Record<RuleStatus, string> = {
  pending: "Pendiente",
  received: "Recibido",
  waived: "Exento",
};

export const ruleStatusClass = (s: string | null) =>
  s === "pending"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
    : s === "received"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
      : "border-border bg-muted/40 text-muted-foreground";

const fmtDue = (iso: string | null) =>
  iso ? format(parseISO(iso), "EEE d MMM, HH:mm", { locale: es }) : null;

const isOverdue = (status: string | null, due: string | null) =>
  status === "pending" && Boolean(due) && new Date(due as string).getTime() < Date.now();

// Invalida todo lo que lista citas.
const CITA_QUERIES = ["citas-hoy", "citas-proximas", "citas-pendientes"];

interface RuleRowProps {
  title: string;
  status: string | null;
  due: string | null;
  detail?: string | null;
  receivedLabel: string;
  onSet: (s: RuleStatus) => Promise<void>;
}

function RuleRow({ title, status, due, detail, receivedLabel, onSet }: RuleRowProps) {
  const [busy, setBusy] = useState<RuleStatus | null>(null);
  const overdue = isOverdue(status, due);

  const set = async (s: RuleStatus) => {
    setBusy(s);
    await onSet(s);
    setBusy(null);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-card-foreground">{title}</p>
        <Badge variant="outline" className={ruleStatusClass(status)}>
          {status ? RULE_STATUS_LABEL[status as RuleStatus] ?? status : "No aplica"}
        </Badge>
      </div>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      {due && status === "pending" && (
        <p className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
          {overdue ? "Venció" : "Vence"} {fmtDue(due)}
        </p>
      )}
      {status && (
        <div className="flex flex-wrap gap-2 pt-1">
          {status !== "received" && (
            <Button size="sm" variant="outline" onClick={() => set("received")} disabled={busy !== null}>
              {busy === "received" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {receivedLabel}
            </Button>
          )}
          {status !== "waived" && (
            <Button size="sm" variant="ghost" onClick={() => set("waived")} disabled={busy !== null}>
              {busy === "waived" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Exentar
            </Button>
          )}
          {status !== "pending" && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => set("pending")} disabled={busy !== null}>
              {busy === "pending" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Volver a pendiente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  cita: Cita | null;
  onClose: () => void;
}

export default function AppointmentSheet({ cita, onClose }: Props) {
  const queryClient = useQueryClient();
  const v2 = cita?.v2 ?? null;

  const [isMinor, setIsMinor] = useState(false);
  const [guardian, setGuardian] = useState("");
  const [dob, setDob] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);

  useEffect(() => {
    setIsMinor(v2?.patient_is_minor ?? false);
    setGuardian(v2?.patient_guardian_name ?? "");
    setDob(v2?.patient_date_of_birth ?? "");
  }, [cita?.id, v2?.patient_is_minor, v2?.patient_guardian_name, v2?.patient_date_of_birth]);

  const invalidate = () => CITA_QUERIES.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const updateAppointment = async (fields: Record<string, unknown>) => {
    if (!cita) return;
    const { data, error } = await (supabase as any)
      .from("appointments")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", cita.id)
      .select("id");
    if (error || !data?.length) {
      toast.error("No se pudo guardar el cambio");
      return;
    }
    toast.success("Guardado", { duration: 1500 });
    invalidate();
  };

  const savePatient = async () => {
    if (!v2 || savingPatient) return;
    setSavingPatient(true);
    const { data, error } = await (supabase as any)
      .from("patients")
      .update({
        is_minor: isMinor,
        guardian_name: isMinor ? guardian.trim() || null : null,
        date_of_birth: dob || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", v2.patient_id)
      .select("id");
    setSavingPatient(false);
    if (error || !data?.length) {
      toast.error("No se pudo guardar el paciente");
      return;
    }
    toast.success("Paciente guardado", { duration: 1500 });
    invalidate();
  };

  const patientDirty =
    v2 !== null &&
    (isMinor !== v2.patient_is_minor ||
      (isMinor ? guardian.trim() : "") !== (v2.patient_guardian_name ?? "") ||
      dob !== (v2.patient_date_of_birth ?? ""));

  return (
    <Sheet open={Boolean(cita)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {cita && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display">
                {cita.nombre_paciente} {cita.apellidos_paciente ?? ""}
              </SheetTitle>
              <SheetDescription>
                {format(parseISO(cita.fecha), "EEEE d 'de' MMMM", { locale: es })} · {cita.hora.slice(0, 5)}
                {cita.modalidad ? ` · ${cita.modalidad}` : ""}
                {v2?.service_name ? ` · ${v2.service_name}` : ""}
                {v2?.price != null ? ` · ${formatMXN(v2.price)}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${cita.telefono}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {cita.telefono}
                </a>
                <Badge variant="outline">{cita.status_cita}</Badge>
                {v2?.is_first_visit && (
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    Primera consulta
                  </Badge>
                )}
              </div>

              {v2?.consultation_reason && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Motivo de consulta
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-card-foreground">{v2.consultation_reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Lo escribió el consultante al agendar. Solo se guarda para entregártelo.
                  </p>
                </div>
              )}

              {v2 && (v2.deposit_status || v2.intake_status) && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Reglas de primera consulta
                  </p>
                  {v2.deposit_status && (
                    <RuleRow
                      title="Anticipo"
                      status={v2.deposit_status}
                      due={v2.deposit_due_at}
                      detail={v2.deposit_amount != null ? formatMXN(v2.deposit_amount) : null}
                      receivedLabel="Marcar recibido"
                      onSet={(s) => updateAppointment({ deposit_status: s })}
                    />
                  )}
                  {v2.intake_status && (
                    <RuleRow
                      title="Formulario previo"
                      status={v2.intake_status}
                      due={v2.intake_due_at}
                      detail={
                        v2.intake_submitted_at
                          ? `Recibido ${fmtDue(v2.intake_submitted_at)}`
                          : null
                      }
                      receivedLabel="Marcar recibido"
                      onSet={(s) =>
                        updateAppointment({
                          intake_status: s,
                          intake_submitted_at: s === "received" ? new Date().toISOString() : null,
                        })
                      }
                    />
                  )}
                </div>
              )}

              {v2 && (
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Consultante
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-sm font-medium">Es menor de edad</Label>
                      <p className="text-xs text-muted-foreground">
                        La cita queda a nombre del menor; aquí registras quién lo acompaña.
                      </p>
                    </div>
                    <Switch checked={isMinor} onCheckedChange={setIsMinor} />
                  </div>
                  {isMinor && (
                    <div className="space-y-1.5">
                      <Label htmlFor="guardian">Madre, padre o tutor</Label>
                      <Input
                        id="guardian"
                        placeholder="Nombre de quien acompaña"
                        value={guardian}
                        onChange={(e) => setGuardian(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="dob">Fecha de nacimiento (opcional)</Label>
                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={savePatient} disabled={!patientDirty || savingPatient}>
                      {savingPatient && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Guardar consultante
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
