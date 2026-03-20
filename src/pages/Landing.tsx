import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Clock, MessageSquare, CalendarCheck } from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "Responde por WhatsApp",
    desc: "Emi atiende a tus pacientes 24/7, agenda citas y resuelve dudas al instante.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda inteligente",
    desc: "Sincroniza con Google Calendar y evita conflictos de horario automáticamente.",
  },
  {
    icon: Clock,
    title: "Ahorra horas al día",
    desc: "Deja que la IA maneje lo repetitivo mientras tú te enfocas en tus pacientes.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const { data } = await supabase
      .from("configuracion_maestra")
      .select("id_cliente")
      .eq("user_id", session.user.id)
      .maybeSingle();
    navigate(data ? "/dashboard" : "/onboarding");
  };
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll(".reveal-section");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-card-foreground">Emi</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            Iniciar sesión
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="reveal-section mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center opacity-0 translate-y-4 transition-all duration-700 ease-out"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Asistente con inteligencia artificial
        </div>
        <h1
          className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          style={{ lineHeight: "1.08", textWrap: "balance" }}
        >
          Tu recepcionista virtual
          <br />
          que nunca descansa
        </h1>
        <p
          className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
          style={{ textWrap: "pretty" }}
        >
          Emi responde WhatsApp, agenda citas y gestiona tu consultorio mientras tú te dedicas a lo que importa: tus pacientes.
        </p>
        <Button
          size="lg"
          className="mt-8 gap-2 text-base shadow-md active:scale-[0.97] transition-transform"
          onClick={() => navigate("/auth")}
        >
          Empezar ahora
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        className="reveal-section mx-auto max-w-5xl px-6 pb-24 opacity-0 translate-y-4 transition-all duration-700 ease-out delay-200"
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Emi · Asistente IA para consultorios
      </footer>
    </div>
  );
};

export default Landing;
