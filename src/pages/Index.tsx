import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AgentSchedule from "@/components/AgentSchedule";
import EmergencyProtocol from "@/components/EmergencyProtocol";
import KpiCards from "@/components/dashboard/KpiCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import DateFilter, { type FilterOption } from "@/components/dashboard/DateFilter";
import { useUserConfig } from "@/hooks/useUserConfig";
import { useResumenDiario } from "@/hooks/useResumenDiario";
import { useFilteredData } from "@/hooks/useFilteredData";
import UserMenu from "@/components/UserMenu";
import { Brain, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PwaInstallBanner from "@/components/PwaInstallBanner";

const Index = () => {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: config, isLoading: configLoading } = useUserConfig();
  const idInstancia = config?.instancia_evolution ?? "";

  const { data, isLoading, isError } = useResumenDiario(idInstancia);

  const [filter, setFilter] = useState<FilterOption>("month");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const filtered = useFilteredData(data ?? [], filter, customFrom, customTo);

  const hasMetrics = filtered.length > 0;
  const metricsLoading = isLoading || configLoading;

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
                  Impacto de Emi (IA)
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
          <div className="mt-3 flex items-center">
            <DateFilter
              filter={filter}
              onFilterChange={setFilter}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* KPI Section */}
        <section>
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen General
          </h2>
          {metricsLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar datos.</p>
          ) : !hasMetrics ? (
            <EmptyState />
          ) : (
            <KpiCards data={filtered} />
          )}
        </section>

        {/* Chart */}
        {hasMetrics && !metricsLoading && (
          <section>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tendencia del Periodo
            </h2>
            <RevenueChart data={filtered} />
          </section>
        )}

        {/* Config & Emergency */}
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Configuración
            </h2>
            <AgentSchedule idInstancia={idInstancia} />
          </section>
          <section>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Emergencia
            </h2>
            <EmergencyProtocol />
          </section>
        </div>
      </main>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
      <Inbox className="h-7 w-7 text-muted-foreground" />
    </div>
    <h3 className="font-display text-lg font-semibold text-card-foreground">Sin datos aún</h3>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      Cuando Emi empiece a trabajar en tu consultorio, aquí verás el resumen de su impacto.
    </p>
  </div>
);

export default Index;
