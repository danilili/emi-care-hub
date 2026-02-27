import AgentSchedule from "@/components/AgentSchedule";
import EmergencyProtocol from "@/components/EmergencyProtocol";
import StatsBoard from "@/components/StatsBoard";
import { Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-card-foreground">
              Emi - Control Center
            </h1>
            <p className="text-xs text-muted-foreground">
              Panel de administración del consultorio
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Stats */}
        <section>
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tablero de Estadísticas
          </h2>
          <StatsBoard />
        </section>

        {/* Two column layout */}
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
