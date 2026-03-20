import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ChevronLeft, ChevronRight, User, MapPin, CalendarDays, Plug, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

interface ScheduleEntry {
  enabled: boolean;
  start: string;
  end: string;
}

type Schedule = Record<DayKey, ScheduleEntry>;

const STEPS = [
  { icon: User, label: "Perfil" },
  { icon: MapPin, label: "Logística" },
  { icon: CalendarDays, label: "Agenda" },
  { icon: Plug, label: "Conexión" },
];

const DEFAULT_SCHEDULE: Schedule = {
  lun: { enabled: true, start: "09:00", end: "18:00" },
  mar: { enabled: true, start: "09:00", end: "18:00" },
  mie: { enabled: true, start: "09:00", end: "18:00" },
  jue: { enabled: true, start: "09:00", end: "18:00" },
  vie: { enabled: true, start: "09:00", end: "18:00" },
  sab: { enabled: false, start: "09:00", end: "14:00" },
  dom: { enabled: false, start: "09:00", end: "14:00" },
};

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1
  const [nombreDoctor, setNombreDoctor] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [descripcionServicios, setDescripcionServicios] = useState("");
  const [perfilPaciente, setPerfilPaciente] = useState("");

  // Step 2
  const [domicilio, setDomicilio] = useState("");
  const [formatoCita, setFormatoCita] = useState("Presencial");
  const [duracionSesion, setDuracionSesion] = useState("60");
  const [telefono, setTelefono] = useState("");

  // Step 3
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  // Step 4
  const [googleCalendarId, setGoogleCalendarId] = useState("");
  const [whatsappOption, setWhatsappOption] = useState("asignar");

  const updateDay = (day: DayKey, field: keyof ScheduleEntry, value: string | boolean) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const buildHorariosJson = () => {
    const result: Record<string, string[]> = {};
    for (const d of DAYS) {
      const entry = schedule[d.key];
      if (entry.enabled) {
        result[d.key] = [`${entry.start}-${entry.end}`];
      }
    }
    return result;
  };

  const canAdvance = () => {
    if (step === 0) return nombreDoctor.trim() && nombreComercial.trim();
    if (step === 1) return telefono.length === 10;
    return true;
  };

  const fireConfetti = () => {
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión primero.", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("configuracion_maestra").insert({
        user_id: user.id,
        nombre_doctor: nombreDoctor.trim(),
        nombre_comercial: nombreComercial.trim(),
        descripcion_servicios: descripcionServicios.trim() || null,
        perfil_paciente: perfilPaciente.trim() || null,
        domicilio_presencial: domicilio.trim() || null,
        formato_cita: formatoCita,
        duracion_sesion: parseInt(duracionSesion) || 60,
        telefono_consultorio: telefono.trim() || null,
        horarios_json: buildHorariosJson(),
        google_calendar_id: googleCalendarId.trim() || null,
      });

      if (error) throw error;

      setDone(true);
      fireConfetti();
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="space-y-6 py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-card-foreground" style={{ lineHeight: "1.1" }}>
              ¡Emi está siendo configurada!
            </h2>
            <p className="text-muted-foreground">
              En breve recibirás un WhatsApp para activarla.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Stepper header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <h1 className="font-display text-lg font-bold text-card-foreground">Configurar tu clínica</h1>
          <span className="text-sm text-muted-foreground">Paso {step + 1} de 4</span>
        </div>
        {/* Progress dots */}
        <div className="mx-auto flex max-w-2xl items-center gap-0 px-6 pb-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-200",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isActive && "border-primary bg-primary/10 text-primary",
                      !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn("text-[11px] font-medium", isActive ? "text-primary" : "text-muted-foreground/60")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 h-0.5 flex-1 rounded-full transition-colors", isCompleted ? "bg-primary" : "bg-muted-foreground/20")} />
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* Form body */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <Card>
          <CardContent className="space-y-5 p-6">
            {/* Step 0 — Perfil Profesional */}
            {step === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_doctor">Nombre del doctor *</Label>
                  <Input id="nombre_doctor" placeholder="Dr. Juan Pérez" value={nombreDoctor} onChange={(e) => setNombreDoctor(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_comercial">Nombre de la clínica *</Label>
                  <Input id="nombre_comercial" placeholder="Consultorio Salud Total" value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc_servicios">Descripción de servicios</Label>
                  <Textarea id="desc_servicios" rows={4} placeholder="Describe brevemente los servicios que ofreces…" value={descripcionServicios} onChange={(e) => setDescripcionServicios(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="perfil_paciente">Perfil del paciente</Label>
                  <Textarea id="perfil_paciente" rows={3} placeholder="¿Qué tipo de pacientes atiendes?" value={perfilPaciente} onChange={(e) => setPerfilPaciente(e.target.value)} />
                </div>
              </>
            )}

            {/* Step 1 — Logística */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="domicilio">Domicilio del consultorio</Label>
                  <Input id="domicilio" placeholder="Av. Reforma 123, CDMX" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Formato de cita</Label>
                  <Select value={formatoCita} onValueChange={setFormatoCita}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presencial">Presencial</SelectItem>
                      <SelectItem value="Virtual">Virtual</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duracion">Duración de sesión (minutos)</Label>
                  <Input id="duracion" type="number" min={15} max={180} step={5} value={duracionSesion} onChange={(e) => setDuracionSesion(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono de consultorio (10 dígitos) *</Label>
                  <Input id="telefono" type="tel" maxLength={10} placeholder="5512345678" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))} />
                  {telefono.length > 0 && telefono.length !== 10 && (
                    <p className="text-xs text-destructive">Debe tener exactamente 10 dígitos</p>
                  )}
                </div>
              </>
            )}

            {/* Step 2 — Agenda */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Selecciona los días y horarios en los que atiendes.</p>
                {DAYS.map((d) => {
                  const entry = schedule[d.key];
                  return (
                    <div key={d.key} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Switch checked={entry.enabled} onCheckedChange={(v) => updateDay(d.key, "enabled", v)} />
                      <span className={cn("w-24 text-sm font-medium", !entry.enabled && "text-muted-foreground/50")}>{d.label}</span>
                      <Input type="time" className="w-28" disabled={!entry.enabled} value={entry.start} onChange={(e) => updateDay(d.key, "start", e.target.value)} />
                      <span className="text-muted-foreground">—</span>
                      <Input type="time" className="w-28" disabled={!entry.enabled} value={entry.end} onChange={(e) => updateDay(d.key, "end", e.target.value)} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3 — Conexión */}
            {step === 3 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="gcal">Email de Google Calendar</Label>
                  <Input id="gcal" type="email" placeholder="tucuenta@gmail.com" value={googleCalendarId} onChange={(e) => setGoogleCalendarId(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Se usará para sincronizar tus citas automáticamente.</p>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>WhatsApp</Label>
                  <RadioGroup value={whatsappOption} onValueChange={setWhatsappOption} className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <RadioGroupItem value="propio" id="wa_propio" />
                      <Label htmlFor="wa_propio" className="cursor-pointer font-normal">Tengo mi propio número de WhatsApp</Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <RadioGroupItem value="asignar" id="wa_asignar" />
                      <Label htmlFor="wa_asignar" className="cursor-pointer font-normal">Necesito que me asignen uno</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer nav */}
      <footer className="border-t border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
          {step < 3 ? (
            <Button disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)}>
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={saving} onClick={handleFinish}>
              {saving ? "Guardando…" : "Finalizar"} <Sparkles className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
