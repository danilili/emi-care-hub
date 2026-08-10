import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Step1Identity from "./onboarding/Step1Identity";
import Step2Services from "./onboarding/Step2Services";
import Step3Schedule from "./onboarding/Step3Schedule";
import Step4BotConfig from "./onboarding/Step4BotConfig";
import Step5Billing from "./onboarding/Step5Billing";
import Step6Documents from "./onboarding/Step6Documents";
import Step7Review from "./onboarding/Step7Review";

type Therapist = Tables<"therapists">;

const STEPS = [
  { icon: User, label: "Identidad" },
  { icon: Briefcase, label: "Servicios" },
  { icon: CalendarDays, label: "Agenda" },
  { icon: Bot, label: "Bot" },
  { icon: CreditCard, label: "Cobro" },
  { icon: FileText, label: "Documentos" },
  { icon: ClipboardCheck, label: "Revisar" },
] as const;

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        toast({ title: "Error al cargar tu cuenta", description: error.message, variant: "destructive" });
        return;
      }
      if (!data) {
        // resolveAuthRedirect should have created this row; bounce back to /auth to retry.
        navigate("/auth");
        return;
      }
      if (data.onboarding_completed_at) {
        navigate("/dashboard");
        return;
      }

      setTherapist(data);
      setLoading(false);
    };
    load();
  }, [navigate, toast]);

  const advance = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleTherapistSaved = (updated: Partial<Therapist>) => {
    setTherapist((prev) => (prev ? { ...prev, ...updated } : prev));
    advance();
  };

  if (loading || !therapist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <h1 className="font-display text-lg font-bold text-card-foreground">Configurar tu cuenta</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Paso {step + 1} de {STEPS.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={async () => {
                // El avance del wizard ya está guardado en Supabase; salir es seguro
                // y permite entrar con otra cuenta (antes no había forma de salir).
                await supabase.auth.signOut();
                navigate("/auth");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-0 overflow-x-auto px-6 pb-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.label} className="flex flex-1 items-center min-w-[68px]">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-200",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isActive && "border-primary bg-primary/10 text-primary",
                      !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground/50",
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium whitespace-nowrap",
                      isActive ? "text-primary" : "text-muted-foreground/60",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        {step === 0 && <Step1Identity therapist={therapist} onSaved={handleTherapistSaved} />}
        {step === 1 && <Step2Services therapist={therapist} onSaved={advance} />}
        {step === 2 && <Step3Schedule therapist={therapist} onSaved={advance} />}
        {step === 3 && <Step4BotConfig therapist={therapist} onSaved={advance} />}
        {step === 4 && <Step5Billing therapist={therapist} onSaved={advance} />}
        {step === 5 && <Step6Documents therapist={therapist} onSaved={advance} />}
        {step === 6 && <Step7Review therapist={therapist} goToStep={setStep} />}
      </main>

      <footer className="border-t border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
          <span className="text-xs text-muted-foreground">
            Cada paso guarda al continuar; puedes salir y regresar después.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
