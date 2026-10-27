import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Json } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { MODALITIES, type Modality } from "@/lib/modalities";
import SharedCalendarsFields, { normalizeCalendarIds } from "@/components/SharedCalendarsFields";

type Therapist = Tables<"therapists">;

interface Block {
  start: string;
  end: string;
  /** "" = cualquier modalidad (comportamiento actual). */
  modality: Modality | "";
}

type Schedule = Record<number, Block[]>;

// Display order: Mon → Sun (Mexican convention). Stored values use 0=Sunday (JS getDay()).
const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

const emptySchedule = (): Schedule =>
  DAYS.reduce((acc, d) => ({ ...acc, [d.value]: [] }), {} as Schedule);

const newBlock = (): Block => ({ start: "09:00", end: "18:00", modality: "" });

// Trims "HH:MM:SS" → "HH:MM" so HTML time inputs don't reject it.
const timeToInput = (t: string) => (t.length >= 5 ? t.slice(0, 5) : t);

const overlaps = (a: Block, b: Block) => a.start < b.end && b.start < a.end;
// Dos bloques solo chocan si comparten modalidad o alguno vale para cualquiera.
const sameLane = (a: Block, b: Block) => !a.modality || !b.modality || a.modality === b.modality;

interface Step3Props {
  therapist: Therapist;
  onSaved: () => void;
}

const Step3Schedule = ({ therapist, onSaved }: Step3Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(emptySchedule);
  const [calendarId, setCalendarId] = useState("");
  const [noCalendar, setNoCalendar] = useState(false);
  const [blockingCalendars, setBlockingCalendars] = useState<string[]>([]);
  const [offeredModalities, setOfferedModalities] = useState<Modality[]>([]);

  useEffect(() => {
    const load = async () => {
      const [schedulesRes, configRes, servicesRes] = await Promise.all([
        supabase
          .from("therapist_schedules")
          .select("day_of_week, start_time, end_time, modality")
          .eq("therapist_id", therapist.id)
          .order("start_time", { ascending: true }),
        supabase
          .from("therapist_config")
          .select("calendar_id, availability_calendar_ids")
          .eq("therapist_id", therapist.id)
          .maybeSingle(),
        supabase
          .from("therapist_services")
          .select("service_variants(modality)")
          .eq("therapist_id", therapist.id),
      ]);

      if (schedulesRes.error) {
        toast({ title: "Error al cargar agenda", description: schedulesRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (configRes.error) {
        toast({ title: "Error al cargar configuración", description: configRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const next = emptySchedule();
      for (const row of schedulesRes.data ?? []) {
        next[row.day_of_week] = next[row.day_of_week] ?? [];
        next[row.day_of_week].push({
          start: timeToInput(row.start_time),
          end: timeToInput(row.end_time),
          modality: (MODALITIES.some((m) => m.value === row.modality) ? row.modality : "") as Modality | "",
        });
      }
      setSchedule(next);

      const savedCalId = configRes.data?.calendar_id?.trim() ?? "";
      if (savedCalId) {
        setCalendarId(savedCalId);
        setNoCalendar(false);
      }
      setBlockingCalendars(normalizeCalendarIds(configRes.data?.availability_calendar_ids));

      const mods = new Set<Modality>();
      for (const s of servicesRes.data ?? []) {
        for (const v of s.service_variants ?? []) {
          if (MODALITIES.some((m) => m.value === v.modality)) mods.add(v.modality as Modality);
        }
      }
      setOfferedModalities(MODALITIES.map((m) => m.value).filter((m) => mods.has(m)));

      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  const addBlock = (day: number) => {
    setSchedule((prev) => ({ ...prev, [day]: [...prev[day], newBlock()] }));
  };

  const removeBlock = (day: number, idx: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };

  const updateBlock = (day: number, idx: number, patch: Partial<Block>) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));
  };

  // Solo tiene sentido elegir modalidad por bloque cuando se ofrece más de una.
  const showModality = offeredModalities.length > 1;

  const validationError = (() => {
    if (!noCalendar && !calendarId.trim()) {
      return "Indica el calendar de Google o marca la casilla \"No tengo un calendar todavía\".";
    }
    if (!noCalendar && blockingCalendars.some((c) => c === calendarId.trim())) {
      return "El calendario donde se escriben las citas ya bloquea disponibilidad; no lo repitas en la lista.";
    }

    const total = DAYS.reduce((sum, d) => sum + schedule[d.value].length, 0);
    if (total === 0) return "Agrega al menos un bloque de horario en cualquier día.";

    for (const d of DAYS) {
      const blocks = schedule[d.value];
      for (const [idx, b] of blocks.entries()) {
        if (!b.start || !b.end) return `Completa los horarios del ${d.label} (bloque ${idx + 1}).`;
        if (b.end <= b.start) return `${d.label}: la hora de fin debe ser mayor a la de inicio.`;
      }
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          if (overlaps(blocks[i], blocks[j]) && sameLane(blocks[i], blocks[j]))
            return `${d.label}: los bloques se traslapan.`;
        }
      }
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;

    setSaving(true);
    try {
      const { error: configErr } = await supabase
        .from("therapist_config")
        .update({
          calendar_id: noCalendar ? null : calendarId.trim(),
          availability_calendar_ids: blockingCalendars,
        })
        .eq("therapist_id", therapist.id);
      if (configErr) throw configErr;

      const payload: { day_of_week: number; start_time: string; end_time: string; modality: string | null }[] = [];
      for (const d of DAYS) {
        for (const b of schedule[d.value]) {
          payload.push({
            day_of_week: d.value,
            start_time: b.start,
            end_time: b.end,
            modality: showModality && b.modality ? b.modality : null,
          });
        }
      }

      const { error } = await supabase.rpc("replace_therapist_schedules", {
        p_blocks: payload as unknown as Json,
      });
      if (error) throw error;

      onSaved();
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Cargando agenda…
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Tu agenda</h2>
        <p className="text-sm text-muted-foreground">
          Conecta el Google Calendar donde se escribirán las citas y selecciona los días y horarios en que ofreces sesiones.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Google Calendar
          </h3>
          {!noCalendar && (
            <div className="space-y-1.5">
              <Label htmlFor="calendar_id">ID del calendar donde se escriben las citas *</Label>
              <Input
                id="calendar_id"
                placeholder="abc123@group.calendar.google.com"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lo encuentras en Google Calendar → Configuración del calendario → Integrar calendario. Si aún no tienes uno, marca la casilla y nuestro equipo te ayudará a configurarlo.
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="no-calendar"
              checked={noCalendar}
              onCheckedChange={(v) => {
                const checked = Boolean(v);
                setNoCalendar(checked);
                if (checked) setCalendarId("");
              }}
            />
            <Label htmlFor="no-calendar" className="cursor-pointer text-sm font-normal">
              No tengo un Google Calendar todavía
            </Label>
          </div>

          <SharedCalendarsFields
            value={blockingCalendars}
            onChange={setBlockingCalendars}
            writeCalendarId={noCalendar ? "" : calendarId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Horarios de atención
          </h3>
          {showModality && (
            <p className="text-xs text-muted-foreground">
              Ofreces más de una modalidad: puedes indicar en qué horarios atiendes cada una. “Cualquier modalidad” sirve para ambas.
            </p>
          )}
          {DAYS.map((d) => {
            const blocks = schedule[d.value];
            return (
              <div key={d.value} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="w-24 pt-2 text-sm font-medium text-card-foreground">
                  {d.label}
                </div>
                <div className="flex-1 space-y-2">
                  {blocks.length === 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addBlock(d.value)}
                      className="text-primary"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Agregar bloque
                    </Button>
                  ) : (
                    <>
                      {blocks.map((block, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 p-2"
                        >
                          <Input
                            type="time"
                            value={block.start}
                            onChange={(e) => updateBlock(d.value, idx, { start: e.target.value })}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">—</span>
                          <Input
                            type="time"
                            value={block.end}
                            onChange={(e) => updateBlock(d.value, idx, { end: e.target.value })}
                            className="w-28"
                          />
                          {showModality && (
                            <Select
                              value={block.modality || "any"}
                              onValueChange={(v) =>
                                updateBlock(d.value, idx, { modality: v === "any" ? "" : (v as Modality) })
                              }
                            >
                              <SelectTrigger className="w-44" aria-label="Modalidad del bloque">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Cualquier modalidad</SelectItem>
                                {MODALITIES.filter((m) => offeredModalities.includes(m.value)).map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBlock(d.value, idx)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar bloque"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addBlock(d.value)}
                        className="text-primary"
                      >
                        <Plus className="mr-1 h-4 w-4" /> Agregar bloque
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={Boolean(validationError) || saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar y continuar <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default Step3Schedule;
