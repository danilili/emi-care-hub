import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTES_HELP, NOTES_LABEL, validateAssistantNotes, type TherapistNames } from "@/lib/assistantNotes";

// Ajustes del asistente que ya existían en therapist_config pero no tenían UI:
// acompañantes, alertas de crisis, avisos al terapeuta, pie de los mensajes, alias y notas libres.

export type CompanionsPolicy = "none" | "minors_only" | "all";

export const COMPANIONS_LABEL: Record<CompanionsPolicy, string> = {
  none: "No se permiten acompañantes",
  minors_only: "Solo con menores de edad",
  all: "Sí, cualquier consultante puede venir acompañado",
};

export const DEFAULT_FOOTER_TEXT = "_(Las citas de este chat se gestionan de forma automática.)_";

export interface AssistantSettings {
  companions_policy: CompanionsPolicy;
  companions_note: string;
  crisis_alerts_enabled: boolean;
  notify_owner_bookings: boolean;
  footer_text: string;
  therapist_alias: string;
  custom_prompt_additions: string;
}

export const ASSISTANT_SETTINGS_COLUMNS =
  "companions_policy, companions_note, crisis_alerts_enabled, notify_owner_bookings, footer_text, therapist_alias, custom_prompt_additions";

export const assistantSettingsFromRow = (
  row: Record<string, unknown> | null | undefined,
): AssistantSettings => ({
  companions_policy: (["none", "minors_only", "all"] as const).includes(row?.companions_policy as CompanionsPolicy)
    ? (row?.companions_policy as CompanionsPolicy)
    : "none",
  companions_note: typeof row?.companions_note === "string" ? row.companions_note : "",
  crisis_alerts_enabled: row?.crisis_alerts_enabled === undefined ? true : Boolean(row.crisis_alerts_enabled),
  notify_owner_bookings: row?.notify_owner_bookings === undefined ? true : Boolean(row.notify_owner_bookings),
  footer_text: typeof row?.footer_text === "string" && row.footer_text ? row.footer_text : DEFAULT_FOOTER_TEXT,
  therapist_alias: typeof row?.therapist_alias === "string" ? row.therapist_alias : "",
  custom_prompt_additions: typeof row?.custom_prompt_additions === "string" ? row.custom_prompt_additions : "",
});

export const assistantSettingsToPatch = (s: AssistantSettings) => ({
  companions_policy: s.companions_policy,
  companions_note: s.companions_policy === "none" ? null : s.companions_note.trim() || null,
  crisis_alerts_enabled: s.crisis_alerts_enabled,
  notify_owner_bookings: s.notify_owner_bookings,
  footer_text: s.footer_text.trim() || DEFAULT_FOOTER_TEXT,
  therapist_alias: s.therapist_alias.trim() || null,
  custom_prompt_additions: s.custom_prompt_additions.trim() || null,
});

export const validateAssistantSettings = (s: AssistantSettings, names: TherapistNames): string | null => {
  if (/\bemi\b/i.test(s.footer_text)) return "El pie de los mensajes no debe mencionar “Emi”: el consultante ve la voz del consultorio.";
  return validateAssistantNotes(s.custom_prompt_additions, names);
};

interface Props {
  value: AssistantSettings;
  onChange: (patch: Partial<AssistantSettings>) => void;
  names: TherapistNames;
  disabled?: boolean;
  idPrefix?: string;
  /** Qué secciones mostrar (por defecto todas). */
  sections?: ("companions" | "alerts" | "voice" | "notes")[];
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h4>
);

const Toggle = ({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 p-3">
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const AssistantSettingsFields = ({
  value,
  onChange,
  names,
  disabled = false,
  idPrefix = "ast",
  sections = ["companions", "alerts", "voice", "notes"],
}: Props) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const notesError = validateAssistantNotes(value.custom_prompt_additions, names);
  const show = (s: (typeof sections)[number]) => sections.includes(s);

  return (
    <div className="space-y-8">
      {show("companions") && (
        <section className="space-y-4">
          <SectionTitle>Acompañantes</SectionTitle>
          <div className="space-y-1.5">
            <Label htmlFor={id("companions")}>¿El consultante puede venir acompañado?</Label>
            <Select
              value={value.companions_policy}
              onValueChange={(v) => onChange({ companions_policy: v as CompanionsPolicy })}
              disabled={disabled}
            >
              <SelectTrigger id={id("companions")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COMPANIONS_LABEL) as CompanionsPolicy[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {COMPANIONS_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {value.companions_policy !== "none" && (
            <div className="space-y-1.5">
              <Label htmlFor={id("companions-note")}>Nota corta (opcional)</Label>
              <Input
                id={id("companions-note")}
                placeholder="Las menores siempre vienen acompañadas; en tercera edad puede acompañar un cuidador."
                value={value.companions_note}
                onChange={(e) => onChange({ companions_note: e.target.value })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Se usa al dar informes y al preparar la cita. Sin nombres propios.
              </p>
            </div>
          )}
        </section>
      )}

      {show("alerts") && (
        <section className="space-y-3">
          <SectionTitle>Avisos para ti</SectionTitle>
          <Toggle
            label="Avisarme de citas nuevas, cambios y comprobantes"
            help="Un mensaje por WhatsApp cada vez que un consultante agenda, mueve, cancela o manda un comprobante."
            checked={value.notify_owner_bookings}
            onChange={(c) => onChange({ notify_owner_bookings: c })}
            disabled={disabled}
          />
          <Toggle
            label="Alertas de crisis"
            help="Si un mensaje contiene palabras de riesgo, se te avisa de inmediato. El consultante nunca recibe una respuesta automática sobre esto."
            checked={value.crisis_alerts_enabled}
            onChange={(c) => onChange({ crisis_alerts_enabled: c })}
            disabled={disabled}
          />
        </section>
      )}

      {show("voice") && (
        <section className="space-y-4">
          <SectionTitle>Cómo te nombra el asistente</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={id("alias")}>Cómo te llaman tus consultantes</Label>
              <Input
                id={id("alias")}
                placeholder={names.first_name ?? "Nombre corto"}
                value={value.therapist_alias}
                onChange={(e) => onChange({ therapist_alias: e.target.value })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Se usa solo en los avisos que te llegan a ti y en los recordatorios (“tu cita con…”).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={id("footer")}>Pie de los mensajes automáticos</Label>
              <Input
                id={id("footer")}
                value={value.footer_text}
                onChange={(e) => onChange({ footer_text: e.target.value })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Línea final que ve el consultante en cada mensaje automático. Los guiones bajos lo ponen en cursiva.
              </p>
            </div>
          </div>
        </section>
      )}

      {show("notes") && (
        <section className="space-y-3">
          <SectionTitle>{NOTES_LABEL}</SectionTitle>
          <Textarea
            id={id("notes")}
            rows={4}
            placeholder="Mi enfoque es… Trabajo con… Me gusta recordar a mis consultantes que…"
            value={value.custom_prompt_additions}
            onChange={(e) => onChange({ custom_prompt_additions: e.target.value })}
            disabled={disabled}
          />
          {notesError ? (
            <p className="text-xs text-destructive">{notesError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{NOTES_HELP}</p>
          )}
        </section>
      )}
    </div>
  );
};

export default AssistantSettingsFields;
