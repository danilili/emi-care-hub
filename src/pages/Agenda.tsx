import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Brain, CalendarDays, ChevronRight, Inbox, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserConfig } from "@/hooks/useUserConfig";
import { useCitasHoy } from "@/hooks/useCitasHoy";
import { useCitasProximas, type Cita } from "@/hooks/useCitasPendientes";
import { NavTabs } from "@/components/NavTabs";
import UserMenu from "@/components/UserMenu";
import AppointmentSheet, { ruleStatusClass } from "@/components/AppointmentSheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

// Estado de anticipo / formulario (solo V2, solo cuando aplica a la cita).
function RuleBadges({ cita }: { cita: Cita }) {
  const v2 = cita.v2;
  if (!v2) return null;
  const overdue = (s: string | null, due: string | null) =>
    s === "pending" && due && new Date(due).getTime() < Date.now();
  return (
    <>
      {v2.deposit_status && (
        <Badge
          variant="outline"
          className={cn(ruleStatusClass(v2.deposit_status), overdue(v2.deposit_status, v2.deposit_due_at) && "border-destructive/40 text-destructive")}
        >
          Anticipo {v2.deposit_status === "pending" ? (overdue(v2.deposit_status, v2.deposit_due_at) ? "vencido" : "pendiente") : v2.deposit_status === "received" ? "recibido" : "exento"}
        </Badge>
      )}
      {v2.intake_status && (
        <Badge
          variant="outline"
          className={cn(ruleStatusClass(v2.intake_status), overdue(v2.intake_status, v2.intake_due_at) && "border-destructive/40 text-destructive")}
        >
          Formulario {v2.intake_status === "pending" ? (overdue(v2.intake_status, v2.intake_due_at) ? "vencido" : "pendiente") : v2.intake_status === "received" ? "recibido" : "exento"}
        </Badge>
      )}
    </>
  );
}

// ── Cita row ──────────────────────────────────────────────────────────────────

function CitaRow({ cita, showDate, onOpen }: { cita: Cita; showDate?: boolean; onOpen?: (c: Cita) => void }) {
  const clickable = Boolean(onOpen && cita.v2);
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen!(cita) : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onOpen!(cita) : undefined}
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border/40 py-4 last:border-0",
        clickable && "-mx-2 cursor-pointer rounded-lg px-2 transition-colors hover:bg-muted/50",
      )}
    >
      {/* Fecha / hora */}
      <div className="w-16 shrink-0">
        {showDate && (
          <p className="text-[11px] uppercase text-muted-foreground">
            {format(parseISO(cita.fecha), "EEE d MMM", { locale: es })}
          </p>
        )}
        <span className="text-sm font-semibold tabular-nums text-card-foreground">{cita.hora.slice(0, 5)}</span>
      </div>

      {/* Nombre */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">
          {cita.nombre_paciente} {cita.apellidos_paciente ?? ""}
          {cita.v2?.is_first_visit && (
            <span className="ml-1.5 text-xs font-normal text-primary">· primera consulta</span>
          )}
        </p>
        <a
          href={`tel:${cita.telefono}`}
          onClick={(e) => e.stopPropagation()}
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
        <RuleBadges cita={cita} />
      </div>
      {clickable && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Filtro = "todas" | "anticipo" | "formulario" | "primera";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "primera", label: "Primera consulta" },
  { value: "anticipo", label: "Anticipo pendiente" },
  { value: "formulario", label: "Formulario pendiente" },
];

const Agenda = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: config } = useUserConfig();
  const isV2 = config?.stack === "v2";
  const { data: citas, isLoading, isError } = useCitasHoy(config);
  const proximas = useCitasProximas(config);

  const [vista, setVista] = useState<"hoy" | "proximas">("hoy");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [abierta, setAbierta] = useState<Cita | null>(null);

  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  const proximasFiltradas = useMemo(() => {
    const list = proximas.data ?? [];
    if (filtro === "todas") return list;
    return list.filter((c) => {
      const v2 = c.v2;
      if (!v2) return false;
      if (filtro === "anticipo") return v2.deposit_status === "pending";
      if (filtro === "formulario") return v2.intake_status === "pending";
      return Boolean(v2.is_first_visit);
    });
  }, [proximas.data, filtro]);

  // Mantener la ficha sincronizada con los datos recargados tras guardar.
  const abiertaActual = useMemo(() => {
    if (!abierta) return null;
    const all = [...(citas ?? []), ...(proximas.data ?? [])];
    return all.find((c) => c.id === abierta.id) ?? abierta;
  }, [abierta, citas, proximas.data]);

  const mostrandoHoy = vista === "hoy" || !isV2;
  const lista = mostrandoHoy ? citas : proximasFiltradas;
  const cargando = mostrandoHoy ? isLoading : proximas.isLoading;
  const error = mostrandoHoy ? isError : proximas.isError;

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
                  Agenda
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
        {isV2 && (
          <Tabs value={vista} onValueChange={(v) => setVista(v as "hoy" | "proximas")} className="mb-4">
            <TabsList>
              <TabsTrigger value="hoy">Hoy</TabsTrigger>
              <TabsTrigger value="proximas">Próximas</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground capitalize">
            {mostrandoHoy ? fechaHoy : "Próximas citas"}
          </h2>
          {!cargando && lista && lista.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              {lista.length} {lista.length === 1 ? "cita" : "citas"}
            </Badge>
          )}
        </div>

        {!mostrandoHoy && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFiltro(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filtro === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {cargando && (
          <Card className="border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
            <CardContent className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive">Error al cargar las citas.</p>
        )}

        {!cargando && !error && lista?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              {mostrandoHoy ? "Sin citas hoy" : filtro === "todas" ? "Sin citas próximas" : "Nada pendiente"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {mostrandoHoy
                ? "No hay citas programadas para hoy."
                : filtro === "todas"
                  ? "No hay citas programadas a partir de hoy."
                  : "Ninguna cita próxima cumple con este filtro."}
            </p>
          </div>
        )}

        {!cargando && lista && lista.length > 0 && (
          <Card className="border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
            <CardContent className="px-5 py-2">
              {lista.map((cita) => (
                <CitaRow
                  key={cita.id}
                  cita={cita}
                  showDate={!mostrandoHoy}
                  onOpen={isV2 ? setAbierta : undefined}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      <AppointmentSheet cita={abiertaActual} onClose={() => setAbierta(null)} />
    </div>
  );
};

export default Agenda;
