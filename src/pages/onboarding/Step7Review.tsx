import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

type Therapist = Tables<"therapists">;

const MODALITY_LABEL: Record<string, string> = {
  in_person: "Presencial",
  virtual: "Virtual",
  home_visit: "A domicilio",
};

const DAY_LABEL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DOC_LABEL: Record<string, string> = {
  privacy_policy: "Aviso de privacidad",
  cv: "Currículum",
  professional_license: "Cédula profesional",
  consent_form: "Carta de consentimiento",
  terms_of_service: "Términos y condiciones",
  fiscal_certificate: "Constancia fiscal",
  other: "Otro",
};

interface ServiceSummary {
  name: string;
  variant_count: number;
}

interface ScheduleByDay {
  day_of_week: number;
  blocks: { start_time: string; end_time: string }[];
}

interface ConfigSummary {
  timezone: string;
  slot_minutes: number | null;
  min_hours_advance: number | null;
  max_days_advance: number | null;
  payment_count: number;
  has_fiscal: boolean;
}

interface Step7Props {
  therapist: Therapist;
  goToStep: (step: number) => void;
}

const fireConfetti = () => {
  const end = Date.now() + 2500;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

const fmtTime = (t: string) => t.slice(0, 5);

const Step7Review = ({ therapist, goToStep }: Step7Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [schedule, setSchedule] = useState<ScheduleByDay[]>([]);
  const [config, setConfig] = useState<ConfigSummary | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const [servicesRes, schedulesRes, configRes, docsRes] = await Promise.all([
        supabase
          .from("therapist_services")
          .select("name, service_variants(modality)")
          .eq("therapist_id", therapist.id)
          .order("sort_order"),
        supabase
          .from("therapist_schedules")
          .select("day_of_week, start_time, end_time")
          .eq("therapist_id", therapist.id)
          .order("day_of_week")
          .order("start_time"),
        supabase
          .from("therapist_config")
          .select("timezone, payment_methods, booking_rules")
          .eq("therapist_id", therapist.id)
          .maybeSingle(),
        supabase
          .from("therapist_documents")
          .select("document_type")
          .eq("therapist_id", therapist.id),
      ]);

      if (servicesRes.error || schedulesRes.error || configRes.error || docsRes.error) {
        toast({
          title: "Error al cargar el resumen",
          description:
            servicesRes.error?.message ||
            schedulesRes.error?.message ||
            configRes.error?.message ||
            docsRes.error?.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setServices(
        (servicesRes.data ?? []).map((s) => ({
          name: s.name,
          variant_count: s.service_variants?.length ?? 0,
        })),
      );

      const byDay = new Map<number, { start_time: string; end_time: string }[]>();
      for (const row of schedulesRes.data ?? []) {
        const list = byDay.get(row.day_of_week) ?? [];
        list.push({ start_time: row.start_time, end_time: row.end_time });
        byDay.set(row.day_of_week, list);
      }
      // Display order Mon→Sun (1..6, then 0).
      const order = [1, 2, 3, 4, 5, 6, 0].filter((d) => byDay.has(d));
      setSchedule(order.map((d) => ({ day_of_week: d, blocks: byDay.get(d) ?? [] })));

      const cfg = configRes.data;
      const rules = (cfg?.booking_rules as Record<string, any> | null) ?? {};
      const payments = (cfg?.payment_methods as unknown as { type: string }[] | null) ?? [];
      setConfig({
        timezone: cfg?.timezone ?? "America/Mexico_City",
        slot_minutes: typeof rules.slot_minutes === "number" ? rules.slot_minutes : null,
        min_hours_advance: typeof rules.min_hours_advance === "number" ? rules.min_hours_advance : null,
        max_days_advance: typeof rules.max_days_advance === "number" ? rules.max_days_advance : null,
        payment_count: payments.length,
        has_fiscal: (docsRes.data ?? []).some((d) => d.document_type === "fiscal_certificate"),
      });

      setDocuments(
        (docsRes.data ?? [])
          .map((d) => d.document_type)
          .filter((t) => t !== "fiscal_certificate"),
      );

      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("therapists")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", therapist.id);
      if (error) throw error;

      setDone(true);
      fireConfetti();
    } catch (err: any) {
      toast({ title: "Error al finalizar", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Cargando resumen…
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-5 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold">¡Tu cuenta está siendo configurada!</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Recibimos tus datos. Nuestro equipo terminará de configurar tu bot de WhatsApp en las próximas horas y te avisará cuando esté listo.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-2">
            Ir al panel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Revisa tu información</h2>
        <p className="text-sm text-muted-foreground">
          Verifica que todo esté correcto. Puedes editar cualquier sección antes de finalizar.
        </p>
      </div>

      <SummarySection title="Identidad" onEdit={() => goToStep(0)}>
        <p className="font-medium text-card-foreground">
          {therapist.first_name} {therapist.last_name}
        </p>
        <p className="text-sm text-muted-foreground">{therapist.profession}</p>
        <p className="text-sm text-muted-foreground">{therapist.brand_name}</p>
        {therapist.phone && (
          <p className="text-sm text-muted-foreground">Tel: {therapist.phone}</p>
        )}
      </SummarySection>

      <SummarySection title="Servicios" onEdit={() => goToStep(1)}>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin servicios.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {services.map((s, i) => (
              <li key={i}>
                <span className="font-medium text-card-foreground">{s.name}</span>{" "}
                <span className="text-muted-foreground">
                  ({s.variant_count} {s.variant_count === 1 ? "modalidad" : "modalidades"})
                </span>
              </li>
            ))}
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Agenda" onEdit={() => goToStep(2)}>
        {schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin bloques de horario.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {schedule.map((d) => (
              <li key={d.day_of_week}>
                <span className="font-medium text-card-foreground">{DAY_LABEL[d.day_of_week]}:</span>{" "}
                <span className="text-muted-foreground">
                  {d.blocks
                    .map((b) => `${fmtTime(b.start_time)}–${fmtTime(b.end_time)}`)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Configuración del bot" onEdit={() => goToStep(3)}>
        {config && (
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            <li>Zona horaria: {config.timezone}</li>
            {config.slot_minutes && (
              <li>
                Slots de {config.slot_minutes === 60 ? "60 min (solo en punto)" : "30 min (en punto y media)"}
              </li>
            )}
            {config.min_hours_advance !== null && (
              <li>Antelación mínima: {config.min_hours_advance} h</li>
            )}
            {config.max_days_advance !== null && (
              <li>Máximo a futuro: {config.max_days_advance} días</li>
            )}
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Cobro y facturación" onEdit={() => goToStep(4)}>
        {config && (
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            <li>
              {config.payment_count} método{config.payment_count === 1 ? "" : "s"} de cobro configurado
              {config.payment_count === 1 ? "" : "s"}
            </li>
            <li>Facturación: {config.has_fiscal ? "✓ constancia subida" : "no activa"}</li>
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Documentos" onEdit={() => goToStep(5)}>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin documentos subidos (puedes hacerlo después).</p>
        ) : (
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {documents.map((t, i) => (
              <li key={i}>• {DOC_LABEL[t] ?? t}</li>
            ))}
          </ul>
        )}
      </SummarySection>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Finalizar configuración <Sparkles className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface SummarySectionProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

const SummarySection = ({ title, onEdit, children }: SummarySectionProps) => (
  <Card>
    <CardContent className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="text-primary">
          <Pencil className="mr-1 h-3 w-3" /> Editar
        </Button>
      </div>
      {children}
    </CardContent>
  </Card>
);

export default Step7Review;
