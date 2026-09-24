import type { Json } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Permisos que controlan qué puede resolver Emi sola cuando un paciente pide
// cambiar la modalidad de su cita o que otra persona la tome.
// Se guarda en therapist_config.appointment_policies (jsonb). Llave ausente = "ask_therapist".

export type PolicyValue = "allowed" | "ask_therapist" | "not_allowed";

export type PolicyKey = "modality_to_virtual" | "modality_to_in_person" | "patient_substitution";

export type AppointmentPolicies = Record<PolicyKey, PolicyValue>;

export const POLICY_FIELDS: { key: PolicyKey; label: string }[] = [
  { key: "modality_to_virtual", label: "Cambiar de presencial a en línea" },
  { key: "modality_to_in_person", label: "Cambiar de en línea a presencial" },
  { key: "patient_substitution", label: "Que otra persona tome la cita del paciente" },
];

export const POLICY_OPTIONS: { value: PolicyValue; label: string }[] = [
  { value: "allowed", label: "Sí, Emi lo resuelve" },
  { value: "ask_therapist", label: "Consultarme primero" },
  { value: "not_allowed", label: "No se permite" },
];

export const POLICY_VALUE_LABEL: Record<PolicyValue, string> = {
  allowed: "Sí, Emi lo resuelve",
  ask_therapist: "Consultarme primero",
  not_allowed: "No se permite",
};

export const POLICIES_HELP = "Si algo no está configurado, Emi te lo consulta; nunca inventa una regla.";

const VALID_VALUES = new Set<string>(POLICY_OPTIONS.map((o) => o.value));

/** Convierte el jsonb de la DB en un objeto completo, rellenando con "ask_therapist". */
export const normalizePolicies = (json: Json | null | undefined): AppointmentPolicies => {
  const raw =
    json && typeof json === "object" && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  const pick = (key: PolicyKey): PolicyValue => {
    const v = raw[key];
    return typeof v === "string" && VALID_VALUES.has(v) ? (v as PolicyValue) : "ask_therapist";
  };
  return {
    modality_to_virtual: pick("modality_to_virtual"),
    modality_to_in_person: pick("modality_to_in_person"),
    patient_substitution: pick("patient_substitution"),
  };
};

interface AppointmentPoliciesFieldsProps {
  value: AppointmentPolicies;
  onChange: (key: PolicyKey, value: PolicyValue) => void;
  disabled?: boolean;
  idPrefix?: string;
}

const AppointmentPoliciesFields = ({
  value,
  onChange,
  disabled = false,
  idPrefix = "policy",
}: AppointmentPoliciesFieldsProps) => (
  <div className="space-y-4">
    <p className="text-xs text-muted-foreground">{POLICIES_HELP}</p>
    {POLICY_FIELDS.map((f) => {
      const id = `${idPrefix}-${f.key}`;
      return (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={id}>{f.label}</Label>
          <Select
            value={value[f.key]}
            onValueChange={(v) => onChange(f.key, v as PolicyValue)}
            disabled={disabled}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POLICY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    })}
  </div>
);

export default AppointmentPoliciesFields;
