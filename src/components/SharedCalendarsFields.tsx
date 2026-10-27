import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

// Consultorio compartido/rentado: además del calendario propio (calendar_id, donde se
// escriben las citas), otros calendarios pueden bloquear disponibilidad.
// Se guarda en therapist_config.availability_calendar_ids (text[]). Vacío = solo el propio.

export const normalizeCalendarIds = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];

const looksLikeCalendarId = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** Para impedir que se repita el calendario donde se escriben las citas. */
  writeCalendarId?: string;
  disabled?: boolean;
}

const SharedCalendarsFields = ({ value, onChange, writeCalendarId = "", disabled = false }: Props) => {
  const [draft, setDraft] = useState("");

  const draftTrim = draft.trim();
  const draftError =
    !draftTrim
      ? null
      : !looksLikeCalendarId(draftTrim)
        ? "Un ID de calendar se ve como abc123@group.calendar.google.com o correo@gmail.com."
        : draftTrim === writeCalendarId.trim()
          ? "Ese es el calendario donde se escriben las citas; ya bloquea disponibilidad."
          : value.includes(draftTrim)
            ? "Ese calendario ya está en la lista."
            : null;

  const add = () => {
    if (!draftTrim || draftError) return;
    onChange([...value, draftTrim]);
    setDraft("");
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
      <Label className="text-sm font-medium">Otros calendarios que bloquean horarios (opcional)</Label>
      <p className="text-xs text-muted-foreground">
        Si rentas consultorio o lo compartes, agrega el calendario del espacio: sus eventos se respetan al
        ofrecer horarios, pero las citas se siguen escribiendo en tu calendario.
      </p>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((c) => (
            <li
              key={c}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
            >
              <span className="min-w-0 truncate">{c}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((x) => x !== c))}
                disabled={disabled}
                aria-label={`Quitar ${c}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="consultorio@group.calendar.google.com"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={disabled || !draftTrim || Boolean(draftError)}
          className="shrink-0"
        >
          <Plus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>
      {draftError && <p className="text-xs text-destructive">{draftError}</p>}
    </div>
  );
};

export default SharedCalendarsFields;
