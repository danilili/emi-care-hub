import AgentSchedule from "@/components/AgentSchedule";
import EmergencyProtocol from "@/components/EmergencyProtocol";
import KpiCards from "@/components/dashboard/KpiCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { useResumenMensual } from "@/hooks/useResumenMensual";
import { Brain, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data, isLoading, isError } = useResumenMensual("Reyes");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-card-foreground">
              Impacto de Emi (IA)
            </h1>
            <p className="text-xs text-muted-foreground">
              Dashboard de métricas · Consultorio Reyes
            </p>
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
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar datos.</p>
          ) : (
            <KpiCards data={data ?? []} />
          )}
        </section>

        {/* Chart */}
        <section>
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tendencia Mensual
          </h2>
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-lg" />
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar gráfica.</p>
          ) : (
            <RevenueChart data={data ?? []} />
          )}
        </section>

        {/* Config & Emergency */}
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Configuración
            </h2>
            <AgentSchedule />
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

export default Index;
