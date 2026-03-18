import { Card, CardContent } from "@/components/ui/card";
import { Brain, Clock, DollarSign } from "lucide-react";
import type { ResumenMensual } from "@/hooks/useResumenMensual";

interface KpiCardsProps {
  data: ResumenMensual[];
}

const KpiCards = ({ data }: KpiCardsProps) => {
  const totalTareas = data.reduce((sum, r) => sum + (r.total_tareas_ia ?? 0), 0);
  const totalMinutos = data.reduce((sum, r) => sum + (r.minutos_ahorrados ?? 0), 0);
  const horasAhorradas = Math.round(totalMinutos / 60);
  const ingresoRecuperado = data.reduce((sum, r) => sum + (r.dinero_gestionado ?? 0), 0);

  const kpis = [
    {
      label: "Total Tareas IA",
      value: totalTareas.toLocaleString("es-MX"),
      icon: Brain,
      gradient: "from-primary to-primary/70",
    },
    {
      label: "Horas Ahorradas",
      value: `${horasAhorradas.toLocaleString("es-MX")} hrs`,
      icon: Clock,
      gradient: "from-success to-success/70",
    },
    {
      label: "Ingreso Recuperado",
      value: ingresoRecuperado.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
      }),
      icon: DollarSign,
      gradient: "from-warning to-warning/70",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="relative overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <CardContent className="flex flex-col gap-3 p-5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-sm`}
            >
              <kpi.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold font-display text-card-foreground">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
            </div>
          </CardContent>
          {/* Decorative blur circle */}
          <div
            className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 blur-2xl`}
          />
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;
