import { useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { hasAdvancedRules, type BookingRules } from "@/lib/bookingRules";

// Reglas de agenda (booking_rules). Se usa en el onboarding y en Ajustes.

const SLOT_OPTIONS = [
  { value: 60, label: "Solo en punto (cada hora)" },
  { value: 30, label: "En punto y media (cada 30 min)" },
] as const;

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

interface Props {
  value: BookingRules;
  onChange: (patch: Partial<BookingRules>) => void;
  disabled?: boolean;
  idPrefix?: string;
}

const BookingRulesFields = ({ value, onChange, disabled = false, idPrefix = "br" }: Props) => {
  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedRules(value));
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={id("slot")}>Horas de inicio para los pacientes *</Label>
        <Select
          value={String(value.slot_minutes)}
          onValueChange={(v) => onChange({ slot_minutes: parseInt(v, 10) })}
          disabled={disabled}
        >
          <SelectTrigger id={id("slot")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLOT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define cada cuánto puede empezar una sesión. Por ejemplo: solo a las 9:00, 10:00, 11:00… o también 9:30, 10:30.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("min-hours")}>Anticipación mínima (horas)</Label>
          <Input
            id={id("min-hours")}
            type="number"
            min={0}
            value={value.min_hours_advance}
            onChange={(e) => onChange({ min_hours_advance: parseInt(e.target.value, 10) || 0 })}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Cuántas horas antes de la sesión es lo más cerca que se puede agendar
            {value.min_hours_business_only ? ", contando solo días hábiles" : ""}.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("max-days")}>Máximo a futuro (días)</Label>
          <Input
            id={id("max-days")}
            type="number"
            min={1}
            value={value.max_days_advance}
            onChange={(e) => onChange({ max_days_advance: parseInt(e.target.value, 10) || 1 })}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">Hasta cuántos días en el futuro se puede agendar.</p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">Contar solo horas hábiles</Label>
            <p className="text-xs text-muted-foreground">
              La anticipación mínima salta los días no hábiles. Ejemplo: con 48 h y fin de semana no hábil,
              el viernes por la tarde ya no se puede agendar para el lunes.
            </p>
          </div>
          <Switch
            checked={value.min_hours_business_only}
            onCheckedChange={(c) => onChange({ min_hours_business_only: c })}
            disabled={disabled}
          />
        </div>
        {value.min_hours_business_only && (
          <div className="space-y-1.5">
            <Label className="text-xs">Días que no cuentan como hábiles</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const off = value.non_business_days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onChange({
                        non_business_days: off
                          ? value.non_business_days.filter((x) => x !== d.value)
                          : [...value.non_business_days, d.value],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      off ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "" : "-rotate-90"}`} />
            Reglas avanzadas
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <p className="text-xs text-muted-foreground">Opcionales. Si dejas un campo vacío, esa regla no se aplica.</p>

          <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3">
            <Label htmlFor={id("same-day")}>No aceptar citas para hoy después de las…</Label>
            <Input
              id={id("same-day")}
              type="time"
              value={value.no_booking_same_day_after}
              onChange={(e) => onChange({ no_booking_same_day_after: e.target.value })}
              className="w-32"
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3">
            <Label>No aceptar citas para mañana si hoy es…</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={value.block_next_day_dow !== null ? String(value.block_next_day_dow) : ""}
                onValueChange={(v) => onChange({ block_next_day_dow: v === "" ? null : parseInt(v, 10) })}
                disabled={disabled}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Día…" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">y ya pasaron las</span>
              <Input
                type="time"
                value={value.block_next_day_time}
                onChange={(e) => onChange({ block_next_day_time: e.target.value })}
                className="w-32"
                disabled={disabled}
              />
              {(value.block_next_day_dow !== null || value.block_next_day_time) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ block_next_day_dow: null, block_next_day_time: "" })}
                  className="text-muted-foreground"
                  disabled={disabled}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BookingRulesFields;
