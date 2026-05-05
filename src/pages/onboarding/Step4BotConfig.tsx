import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

type Therapist = Tables<"therapists">;

const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (Centro)" },
  { value: "America/Tijuana", label: "Tijuana (Pacífico)" },
  { value: "America/Hermosillo", label: "Hermosillo (Pacífico, sin horario verano)" },
  { value: "America/Mazatlan", label: "Mazatlán" },
  { value: "America/Chihuahua", label: "Chihuahua" },
  { value: "America/Cancun", label: "Cancún (Quintana Roo)" },
] as const;

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

interface Step4Props {
  therapist: Therapist;
  onSaved: () => void;
}

const Step4BotConfig = ({ therapist, onSaved }: Step4Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [officeAddress, setOfficeAddress] = useState("");
  const [virtualMeetingUrl, setVirtualMeetingUrl] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [customPromptAdditions, setCustomPromptAdditions] = useState("");

  const [slotMinutes, setSlotMinutes] = useState<number>(60);
  const [minHoursAdvance, setMinHoursAdvance] = useState(4);
  const [maxDaysAdvance, setMaxDaysAdvance] = useState(60);
  const [noBookingSameDayAfter, setNoBookingSameDayAfter] = useState("");
  const [blockNextDayDow, setBlockNextDayDow] = useState<number | null>(null);
  const [blockNextDayTime, setBlockNextDayTime] = useState("");

  const [hasInPerson, setHasInPerson] = useState(false);
  const [hasVirtual, setHasVirtual] = useState(false);
  const [hasHomeVisit, setHasHomeVisit] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [configRes, servicesRes] = await Promise.all([
        supabase
          .from("therapist_config")
          .select("timezone, office_address, virtual_meeting_url, cancellation_policy, custom_prompt_additions, booking_rules")
          .eq("therapist_id", therapist.id)
          .maybeSingle(),
        supabase
          .from("therapist_services")
          .select("service_variants(modality)")
          .eq("therapist_id", therapist.id),
      ]);

      if (configRes.error) {
        toast({ title: "Error al cargar configuración", description: configRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (servicesRes.error) {
        toast({ title: "Error al cargar modalidades", description: servicesRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const cfg = configRes.data;
      if (cfg) {
        setTimezone(cfg.timezone);
        setOfficeAddress(cfg.office_address ?? "");
        setVirtualMeetingUrl(cfg.virtual_meeting_url ?? "");
        setCancellationPolicy(cfg.cancellation_policy ?? "");
        setCustomPromptAdditions(cfg.custom_prompt_additions ?? "");

        const rules = (cfg.booking_rules as Record<string, any> | null) ?? {};
        if (typeof rules.slot_minutes === "number") setSlotMinutes(rules.slot_minutes);
        if (typeof rules.min_hours_advance === "number") setMinHoursAdvance(rules.min_hours_advance);
        if (typeof rules.max_days_advance === "number") setMaxDaysAdvance(rules.max_days_advance);
        if (typeof rules.no_booking_same_day_after === "string") {
          setNoBookingSameDayAfter(rules.no_booking_same_day_after.slice(0, 5));
        }
        if (rules.block_next_day_from && typeof rules.block_next_day_from === "object") {
          const b = rules.block_next_day_from;
          if (typeof b.day_of_week === "number") setBlockNextDayDow(b.day_of_week);
          if (typeof b.after_time === "string") setBlockNextDayTime(b.after_time.slice(0, 5));
          if (b.day_of_week !== undefined || b.after_time) setAdvancedOpen(true);
        }
        if (rules.no_booking_same_day_after) setAdvancedOpen(true);
      }

      const modalities = new Set<string>();
      for (const s of servicesRes.data ?? []) {
        for (const v of s.service_variants ?? []) {
          modalities.add(v.modality);
        }
      }
      setHasInPerson(modalities.has("in_person"));
      setHasVirtual(modalities.has("virtual"));
      setHasHomeVisit(modalities.has("home_visit"));

      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  // If the loaded timezone isn't in our common list, add it to the dropdown so the user can see it.
  const timezoneOptions = TIMEZONES.some((t) => t.value === timezone)
    ? TIMEZONES
    : [...TIMEZONES, { value: timezone, label: timezone }];

  const validationError = (() => {
    if (!timezone) return "Selecciona una zona horaria.";
    if ((hasInPerson || hasHomeVisit) && !officeAddress.trim()) {
      return "Como ofreces servicios presenciales, agrega la dirección del consultorio.";
    }
    if (hasVirtual) {
      const url = virtualMeetingUrl.trim();
      if (!url) return "Como ofreces servicios virtuales, agrega la liga de la videollamada.";
      if (!/^https?:\/\//i.test(url))
        return "La liga de videollamada debe empezar con http:// o https://";
    }
    if (!cancellationPolicy.trim()) return "La política de cancelación no puede estar vacía.";
    if (minHoursAdvance < 0) return "El mínimo de horas de anticipación no puede ser negativo.";
    if (maxDaysAdvance < 1) return "El máximo de días debe ser al menos 1.";
    if ((blockNextDayDow !== null) !== Boolean(blockNextDayTime)) {
      return "Para bloquear el día siguiente, completa día y hora (o limpia ambos).";
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;

    setSaving(true);
    try {
      const bookingRules: Record<string, unknown> = {
        slot_minutes: slotMinutes,
        min_hours_advance: minHoursAdvance,
        max_days_advance: maxDaysAdvance,
      };
      if (noBookingSameDayAfter) {
        bookingRules.no_booking_same_day_after = noBookingSameDayAfter;
      }
      if (blockNextDayDow !== null && blockNextDayTime) {
        bookingRules.block_next_day_from = {
          day_of_week: blockNextDayDow,
          after_time: blockNextDayTime,
        };
      }

      const { error } = await supabase
        .from("therapist_config")
        .update({
          timezone,
          office_address: officeAddress.trim() || null,
          virtual_meeting_url: virtualMeetingUrl.trim() || null,
          cancellation_policy: cancellationPolicy.trim(),
          custom_prompt_additions: customPromptAdditions.trim() || null,
          booking_rules: bookingRules as Json,
        })
        .eq("therapist_id", therapist.id);

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
          Cargando configuración…
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Configuración del bot</h2>
        <p className="text-sm text-muted-foreground">
          Reglas que Emi usará para responder a tus pacientes y agendar sus citas.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Zona horaria
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Tu zona horaria *</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {(hasInPerson || hasHomeVisit || hasVirtual) && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Lugares
            </h3>
            {(hasInPerson || hasHomeVisit) && (
              <div className="space-y-1.5">
                <Label htmlFor="office_address">Dirección del consultorio *</Label>
                <Input
                  id="office_address"
                  placeholder="Av. Reforma 123, CDMX"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Emi se la dará a tus pacientes cuando agenden una sesión {hasInPerson && hasHomeVisit ? "presencial o a domicilio" : hasInPerson ? "presencial" : "a domicilio"}.
                </p>
              </div>
            )}
            {hasVirtual && (
              <div className="space-y-1.5">
                <Label htmlFor="virtual_url">Liga de videollamada *</Label>
                <Input
                  id="virtual_url"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={virtualMeetingUrl}
                  onChange={(e) => setVirtualMeetingUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Liga única y permanente (Zoom personal, Google Meet, etc.). Emi se la dará a tus pacientes cuando agenden una sesión virtual.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Reglas de agenda
          </h3>

          <div className="space-y-1.5">
            <Label htmlFor="slot_minutes">Horas de inicio para los pacientes *</Label>
            <Select
              value={String(slotMinutes)}
              onValueChange={(v) => setSlotMinutes(parseInt(v, 10))}
            >
              <SelectTrigger id="slot_minutes">
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
              <Label htmlFor="min_hours">Anticipación mínima (horas)</Label>
              <Input
                id="min_hours"
                type="number"
                min={0}
                value={minHoursAdvance}
                onChange={(e) => setMinHoursAdvance(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Cuántas horas antes de la sesión es lo más cerca que se puede agendar.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_days">Máximo a futuro (días)</Label>
              <Input
                id="max_days"
                type="number"
                min={1}
                value={maxDaysAdvance}
                onChange={(e) => setMaxDaysAdvance(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Hasta cuántos días en el futuro se puede agendar.
              </p>
            </div>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "" : "-rotate-90"}`} />
                Reglas avanzadas
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <p className="text-xs text-muted-foreground">
                Opcionales. Si dejas un campo vacío, esa regla no se aplica.
              </p>

              <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3">
                <Label htmlFor="no_same_day">No aceptar citas para hoy después de las…</Label>
                <Input
                  id="no_same_day"
                  type="time"
                  value={noBookingSameDayAfter}
                  onChange={(e) => setNoBookingSameDayAfter(e.target.value)}
                  className="w-32"
                />
              </div>

              <div className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3">
                <Label>No aceptar citas para mañana si hoy es…</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={blockNextDayDow !== null ? String(blockNextDayDow) : ""}
                    onValueChange={(v) => setBlockNextDayDow(v === "" ? null : parseInt(v, 10))}
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
                    value={blockNextDayTime}
                    onChange={(e) => setBlockNextDayTime(e.target.value)}
                    className="w-32"
                  />
                  {(blockNextDayDow !== null || blockNextDayTime) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBlockNextDayDow(null);
                        setBlockNextDayTime("");
                      }}
                      className="text-muted-foreground"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Política de cancelación
          </h3>
          <Textarea
            id="cancellation"
            rows={3}
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Emi la repetirá a tus pacientes cuando agenden o intenten cancelar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Instrucciones adicionales (opcional)
          </h3>
          <Textarea
            id="custom_prompt"
            rows={4}
            placeholder="Tu estilo de comunicación, temas que prefieres evitar, frases típicas que usas, etc."
            value={customPromptAdditions}
            onChange={(e) => setCustomPromptAdditions(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Cualquier cosa que quieras que Emi tenga en cuenta al hablar con tus pacientes.
          </p>
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

export default Step4BotConfig;
