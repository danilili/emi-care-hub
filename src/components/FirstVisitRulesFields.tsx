import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { modalityLabel } from "@/lib/modalities";
import {
  DEPOSIT_APPLIES_LABEL,
  DEPOSIT_MODE_LABEL,
  INTAKE_MODE_LABEL,
  depositForPrice,
  formatMXN,
  isHttpUrl,
  suggestedMinHours,
  type DepositAppliesTo,
  type DepositMode,
  type FirstVisitRules,
  type IntakeMode,
} from "@/lib/firstVisitRules";

// Reglas de primera consulta: anticipo, intake (pregunta o formulario) y mínimo de
// anticipación. Componente controlado; el padre guarda con rulesToPatch().

export interface PreviewVariant {
  service_name: string;
  modality: string;
  price: number;
  applies_to: string | null;
}

interface Props {
  value: FirstVisitRules;
  onChange: (patch: Partial<FirstVisitRules>) => void;
  variants: PreviewVariant[];
  /** booking_rules.min_hours_advance del tenant, para avisar si el mínimo de primera consulta es menor. */
  bookingMinHours: number | null;
  disabled?: boolean;
  idPrefix?: string;
}

const intInput = (v: string): number | null => {
  if (v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const numInput = (v: string): number | null => {
  if (v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h4>
);

const FirstVisitRulesFields = ({
  value,
  onChange,
  variants,
  bookingMinHours,
  disabled = false,
  idPrefix = "fvr",
}: Props) => {
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  const id = (s: string) => `${idPrefix}-${s}`;

  const verifyUrl = async () => {
    const url = value.intake_form_url.trim();
    if (!isHttpUrl(url)) {
      setCheckMsg("La URL debe empezar con https://");
      onChange({ form_url_verified: false });
      return;
    }
    setChecking(true);
    setCheckMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-url", { body: { url } });
      if (error) throw error;
      const res = data as { ok: boolean; status?: number; error?: string };
      if (res.ok) {
        onChange({ form_url_verified: true });
        setCheckMsg("La página responde.");
      } else {
        onChange({ form_url_verified: false });
        setCheckMsg(
          res.error === "timeout"
            ? "La página tardó demasiado en responder."
            : res.status
              ? `La página respondió con error ${res.status}.`
              : "No se pudo abrir la página. Revisa la URL.",
        );
      }
    } catch {
      onChange({ form_url_verified: false });
      setCheckMsg("No se pudo verificar la URL. Intenta de nuevo.");
    } finally {
      setChecking(false);
    }
  };

  const suggested = suggestedMinHours(value);
  const minHours = value.first_visit_min_hours_advance;
  const effectiveMin = minHours ?? bookingMinHours;
  const belowBooking =
    minHours !== null && bookingMinHours !== null && minHours < bookingMinHours;
  const belowSuggested = suggested !== null && effectiveMin !== null && effectiveMin < suggested;

  const previewRows = variants.filter(
    (v) => value.deposit_applies_to === "all" || v.applies_to !== "follow_up",
  );

  return (
    <div className="space-y-8">
      {/* ── Anticipo ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Anticipo</SectionTitle>
        <div className="space-y-1.5">
          <Label htmlFor={id("deposit-mode")}>¿Pides anticipo para apartar la cita?</Label>
          <Select
            value={value.deposit_mode}
            onValueChange={(v) => onChange({ deposit_mode: v as DepositMode })}
            disabled={disabled}
          >
            <SelectTrigger id={id("deposit-mode")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DEPOSIT_MODE_LABEL) as DepositMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {DEPOSIT_MODE_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {value.deposit_mode === "partial" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={id("deposit-kind")}>Cómo se calcula</Label>
              <Select
                value={value.deposit_kind}
                onValueChange={(v) => onChange({ deposit_kind: v as "percent" | "amount" })}
                disabled={disabled}
              >
                <SelectTrigger id={id("deposit-kind")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Porcentaje del precio</SelectItem>
                  <SelectItem value="amount">Monto fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {value.deposit_kind === "percent" ? (
              <div className="space-y-1.5">
                <Label htmlFor={id("deposit-percent")}>Porcentaje (%)</Label>
                <Input
                  id={id("deposit-percent")}
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  value={value.deposit_percent ?? ""}
                  onChange={(e) => onChange({ deposit_percent: numInput(e.target.value) })}
                  disabled={disabled}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor={id("deposit-amount")}>Monto (MXN)</Label>
                <Input
                  id={id("deposit-amount")}
                  type="number"
                  min={1}
                  step={50}
                  value={value.deposit_amount ?? ""}
                  onChange={(e) => onChange({ deposit_amount: numInput(e.target.value) })}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}

        {value.deposit_mode !== "none" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={id("deposit-deadline")}>Plazo para pagarlo (días antes de la cita)</Label>
                <Input
                  id={id("deposit-deadline")}
                  type="number"
                  min={0}
                  value={value.deposit_deadline_days ?? ""}
                  onChange={(e) => onChange({ deposit_deadline_days: intInput(e.target.value) })}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  0 = el mismo día de la cita. Si vence sin pago, se te avisa; la cita no se cancela sola.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={id("deposit-applies")}>A qué citas aplica</Label>
                <Select
                  value={value.deposit_applies_to}
                  onValueChange={(v) => onChange({ deposit_applies_to: v as DepositAppliesTo })}
                  disabled={disabled}
                >
                  <SelectTrigger id={id("deposit-applies")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEPOSIT_APPLIES_LABEL) as DepositAppliesTo[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {DEPOSIT_APPLIES_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {previewRows.length > 0 && (
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Vista previa del anticipo que verá el consultante
                </p>
                <ul className="space-y-1 text-sm">
                  {previewRows.map((v, i) => {
                    const dep = depositForPrice(value, v.price);
                    return (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-card-foreground">
                          {v.service_name}{" "}
                          <span className="text-muted-foreground">· {modalityLabel(v.modality)} · {formatMXN(v.price)}</span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {dep === null ? "—" : formatMXN(dep)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Intake ───────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Antes de la primera consulta</SectionTitle>
        <div className="space-y-1.5">
          <Label htmlFor={id("intake-mode")}>¿Necesitas información del consultante antes de verlo?</Label>
          <Select
            value={value.intake_mode}
            onValueChange={(v) => onChange({ intake_mode: v as IntakeMode })}
            disabled={disabled}
          >
            <SelectTrigger id={id("intake-mode")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INTAKE_MODE_LABEL) as IntakeMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {INTAKE_MODE_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Lo que responda se guarda solo para entregártelo. No se interpreta ni se reutiliza.
          </p>
        </div>

        {value.intake_mode === "question" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={id("question-text")}>Pregunta, tal cual se le hará</Label>
              <Textarea
                id={id("question-text")}
                rows={2}
                placeholder="¿Me cuentas brevemente el motivo de tu consulta?"
                value={value.intake_question_text}
                onChange={(e) => onChange({ intake_question_text: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 p-3">
              <div>
                <Label className="text-sm font-medium">Obligatoria para agendar</Label>
                <p className="text-xs text-muted-foreground">
                  Si está apagado, el consultante puede saltarla y la cita se crea igual.
                </p>
              </div>
              <Switch
                checked={value.intake_question_required}
                onCheckedChange={(c) => onChange({ intake_question_required: c })}
                disabled={disabled}
              />
            </div>
          </>
        )}

        {value.intake_mode === "form" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={id("form-url")}>URL del formulario</Label>
              <div className="flex gap-2">
                <Input
                  id={id("form-url")}
                  type="url"
                  placeholder="https://tusitio.com/formulario"
                  value={value.intake_form_url}
                  onChange={(e) => {
                    onChange({ intake_form_url: e.target.value, form_url_verified: false });
                    setCheckMsg(null);
                  }}
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={verifyUrl}
                  disabled={disabled || checking || !value.intake_form_url.trim()}
                  className="shrink-0"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>
              {(checkMsg || value.form_url_verified) && (
                <p
                  className={`flex items-center gap-1 text-xs ${
                    value.form_url_verified ? "text-emerald-500" : "text-destructive"
                  }`}
                >
                  {value.form_url_verified ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {checkMsg ?? "URL verificada."}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                El formulario no se activa hasta que la página responda. El enlace se comparte al
                confirmar la primera cita y se recuerda en el recordatorio.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={id("form-deadline")}>Plazo para llenarlo (días antes de la cita)</Label>
                <Input
                  id={id("form-deadline")}
                  type="number"
                  min={0}
                  value={value.intake_form_deadline_days ?? ""}
                  onChange={(e) => onChange({ intake_form_deadline_days: intInput(e.target.value) })}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 p-3">
                <div>
                  <Label className="text-sm font-medium">Obligatorio</Label>
                  <p className="text-xs text-muted-foreground">
                    Si vence sin llenarse, se te avisa y se le recuerda una vez al consultante.
                  </p>
                </div>
                <Switch
                  checked={value.intake_form_required}
                  onCheckedChange={(c) => onChange({ intake_form_required: c })}
                  disabled={disabled}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Mínimo de anticipación ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Anticipación para primeras consultas</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={id("min-hours")}>Mínimo de horas antes de la cita</Label>
            <Input
              id={id("min-hours")}
              type="number"
              min={0}
              placeholder={bookingMinHours !== null ? `${bookingMinHours} (regla general)` : "Vacío = regla general"}
              value={minHours ?? ""}
              onChange={(e) => onChange({ first_visit_min_hours_advance: intInput(e.target.value) })}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Vacío = se usa la anticipación mínima general de tu agenda
              {bookingMinHours !== null ? ` (${bookingMinHours} h)` : ""}.
            </p>
          </div>
          {suggested !== null && (
            <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3 text-sm">
              <p className="text-muted-foreground">
                Sugerido: <span className="font-medium text-card-foreground">{suggested} h</span>{" "}
                (el mayor entre el plazo del formulario y el del anticipo).
              </p>
              {minHours !== suggested && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-primary"
                  onClick={() => onChange({ first_visit_min_hours_advance: suggested })}
                  disabled={disabled}
                >
                  Usar {suggested} h
                </Button>
              )}
            </div>
          )}
        </div>
        {belowBooking && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Es menor que la anticipación general de tu agenda ({bookingMinHours} h). Las primeras consultas
            podrán agendarse más cerca que las demás.
          </p>
        )}
        {belowSuggested && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Con {effectiveMin} h, una primera consulta podría agendarse después de que venza el plazo del
            formulario o del anticipo ({suggested} h). En ese caso el plazo se recorta a “antes de la cita”.
          </p>
        )}
      </section>
    </div>
  );
};

export default FirstVisitRulesFields;
