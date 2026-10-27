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
import { ChevronRight, Loader2 } from "lucide-react";
import BookingRulesFields from "@/components/BookingRulesFields";
import {
  DEFAULT_BOOKING_RULES,
  bookingRulesFromJson,
  bookingRulesToJson,
  validateBookingRules,
  type BookingRules,
} from "@/lib/bookingRules";
import AppointmentPoliciesFields, {
  normalizePolicies,
  type AppointmentPolicies,
} from "@/components/AppointmentPoliciesFields";
import FirstVisitRulesFields, { type PreviewVariant } from "@/components/FirstVisitRulesFields";
import AssistantSettingsFields, {
  ASSISTANT_SETTINGS_COLUMNS,
  assistantSettingsFromRow,
  assistantSettingsToPatch,
  validateAssistantSettings,
  type AssistantSettings,
} from "@/components/AssistantSettingsFields";
import {
  FIRST_VISIT_RULES_COLUMNS,
  defaultFirstVisitRules,
  rulesFromRow,
  rulesToPatch,
  validateFirstVisitRules,
  type FirstVisitRules,
} from "@/lib/firstVisitRules";

type Therapist = Tables<"therapists">;

const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (Centro)" },
  { value: "America/Tijuana", label: "Tijuana (Pacífico)" },
  { value: "America/Hermosillo", label: "Hermosillo (Pacífico, sin horario verano)" },
  { value: "America/Mazatlan", label: "Mazatlán" },
  { value: "America/Chihuahua", label: "Chihuahua" },
  { value: "America/Cancun", label: "Cancún (Quintana Roo)" },
] as const;

interface Step4Props {
  therapist: Therapist;
  onSaved: () => void;
}

const Step4BotConfig = ({ therapist, onSaved }: Step4Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [officeAddress, setOfficeAddress] = useState("");
  const [virtualMeetingUrl, setVirtualMeetingUrl] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [appointmentPolicies, setAppointmentPolicies] = useState<AppointmentPolicies>(
    normalizePolicies(null),
  );
  const [firstVisit, setFirstVisit] = useState<FirstVisitRules>(defaultFirstVisitRules);
  const [assistant, setAssistant] = useState<AssistantSettings>(() => assistantSettingsFromRow(null));
  const [previewVariants, setPreviewVariants] = useState<PreviewVariant[]>([]);

  const [bookingRules, setBookingRules] = useState<BookingRules>(DEFAULT_BOOKING_RULES);

  const [hasInPerson, setHasInPerson] = useState(false);
  const [hasVirtual, setHasVirtual] = useState(false);
  const [hasHomeVisit, setHasHomeVisit] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [configRes, servicesRes] = await Promise.all([
        supabase
          .from("therapist_config")
          .select(
            `timezone, office_address, virtual_meeting_url, cancellation_policy, booking_rules, appointment_policies, ${FIRST_VISIT_RULES_COLUMNS}, ${ASSISTANT_SETTINGS_COLUMNS}`,
          )
          .eq("therapist_id", therapist.id)
          .maybeSingle(),
        supabase
          .from("therapist_services")
          .select("name, applies_to, service_variants(modality, price, active)")
          .eq("therapist_id", therapist.id)
          .order("sort_order"),
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
        setAppointmentPolicies(normalizePolicies(cfg.appointment_policies));
        setFirstVisit(rulesFromRow(cfg as unknown as Record<string, unknown>));
        setAssistant(assistantSettingsFromRow(cfg as unknown as Record<string, unknown>));

        setBookingRules(bookingRulesFromJson(cfg.booking_rules));
      }

      const modalities = new Set<string>();
      const preview: PreviewVariant[] = [];
      for (const s of servicesRes.data ?? []) {
        for (const v of s.service_variants ?? []) {
          modalities.add(v.modality);
          if (v.active !== false) {
            preview.push({ service_name: s.name, modality: v.modality, price: Number(v.price), applies_to: s.applies_to });
          }
        }
      }
      setPreviewVariants(preview);
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
    const br = validateBookingRules(bookingRules);
    if (br) return br;
    const fv = validateFirstVisitRules(firstVisit);
    if (fv) return fv;
    const as = validateAssistantSettings(assistant, {
      first_name: therapist.first_name,
      last_name: therapist.last_name,
      alias: assistant.therapist_alias,
    });
    if (as) return as;
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("therapist_config")
        .update({
          timezone,
          office_address: officeAddress.trim() || null,
          virtual_meeting_url: virtualMeetingUrl.trim() || null,
          cancellation_policy: cancellationPolicy.trim(),
          booking_rules: bookingRulesToJson(bookingRules),
          appointment_policies: appointmentPolicies as unknown as Json,
          ...rulesToPatch(firstVisit),
          ...assistantSettingsToPatch(assistant),
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
        <h2 className="font-display text-xl font-bold">Configuración del asistente</h2>
        <p className="text-sm text-muted-foreground">
          Reglas con las que el asistente responde a tus consultantes y agenda sus citas. Todo lo que cambia su comportamiento sale de estos campos.
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
                  Se comparte con el consultante al agendar una sesión {hasInPerson && hasHomeVisit ? "presencial o a domicilio" : hasInPerson ? "presencial" : "a domicilio"}.
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
                  Liga única y permanente (Zoom personal, Google Meet, etc.). Se comparte con el consultante al agendar una sesión en línea.
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

          <BookingRulesFields
            value={bookingRules}
            onChange={(patch) => setBookingRules((prev) => ({ ...prev, ...patch }))}
            idPrefix="ob-br"
          />
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
            Se repite al consultante cuando agenda o intenta cancelar. Si pides anticipo, configúralo abajo en “Primera consulta”: ahí sí lo aplica el asistente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Políticas de citas
          </h3>
          <AppointmentPoliciesFields
            value={appointmentPolicies}
            onChange={(key, value) =>
              setAppointmentPolicies((prev) => ({ ...prev, [key]: value }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Primera consulta
          </h3>
          <p className="text-xs text-muted-foreground">
            Anticipo, información previa y anticipación mínima para quien nunca ha venido. Si no pides nada, déjalo como está.
          </p>
          <FirstVisitRulesFields
            value={firstVisit}
            onChange={(patch) => setFirstVisit((prev) => ({ ...prev, ...patch }))}
            variants={previewVariants}
            bookingMinHours={bookingRules.min_hours_advance}
            idPrefix="ob-fvr"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Acompañantes, avisos y voz
          </h3>
          <AssistantSettingsFields
            value={assistant}
            onChange={(patch) => setAssistant((prev) => ({ ...prev, ...patch }))}
            names={{ first_name: therapist.first_name, last_name: therapist.last_name, alias: assistant.therapist_alias }}
            idPrefix="ob-ast"
          />
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
