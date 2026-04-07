import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Brain, CalendarDays, Inbox, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserConfig } from "@/hooks/useUserConfig";
import { useCitasHoy } from "@/hooks/useCitasHoy";
import { NavTabs } from "@/components/NavTabs";
import UserMenu from "@/components/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cita } from "@/hooks/useCitasPendientes";

// ── Badges ────────────────────────────────────────────────────────────────────

function ModalidadBadge({ modalidad }: { modalidad: string | null }) {
  const isVideo = modalidad === "Videollamada";
  return (
    <Badge
      variant="outline"
      className={
        isVideo
          ? "border-purple-400/40 bg-purple-400/10 text-purple-400"
          : "border-orange-400/40 bg-orange-400/10 text-orange-400"
      }
    >
      {modalidad ?? "Presencial"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    "Por Confirmar": "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    Agendado: "border-border bg-muted/40 text-muted-foreground",
    Cancelado: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <Badge variant="outline" className={map[status] ?? map["Agendado"]}>
      {status}
    </Badge>
  );
}

// ── Cita row ──────────────────────────────────────────────────────────────────

function CitaRow({ cita }: { cita: Cita }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/40 py-4 last:border-0">
      {/* Hora */}
      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
        {cita.hora.slice(0, 5)}
      </span>

      {/* Nombre */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">
          {cita.nombre_paciente} {cita.apellidos_paciente ?? ""}
        </p>
        <a
          href={`tel:${cita.telefono}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-3 w-3" />
          {cita.telefono}
        </a>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        <ModalidadBadge modalidad={cita.modalidad} />
        <StatusBadge status={cita.status_cita} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Agenda = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: config } = useUserConfig();
  const { data: citas, isLoading, isError } = useCitasHoy(config?.id_cliente);

  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm sm:h-10 sm:w-10">
                <Brain className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold text-card-foreground truncate sm:text-xl">
                  Agenda del día
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {config?.nombre_comercial ?? "Cargando…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UserMenu config={config ?? null} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <NavTabs />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground capitalize">
            {fechaHoy}
          </h2>
          {!isLoading && citas && citas.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              {citas.length} {citas.length === 1 ? "cita" : "citas"}
            </Badge>
          )}
        </div>

        {isLoading && (
          <Card className="border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
            <CardContent className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </CardContent>
          </Card>
        )}

        {isError && (
          <p className="text-sm text-destructive">Error al cargar las citas de hoy.</p>
        )}

        {!isLoading && !isError && citas?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Sin citas hoy
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              No hay citas programadas para hoy.
            </p>
          </div>
        )}

        {!isLoading && citas && citas.length > 0 && (
          <Card className="border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
            <CardContent className="px-5 py-2">
              {citas.map((cita) => (
                <CitaRow key={cita.id} cita={cita} />
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Agenda;
