import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, TrendingUp, UserPlus } from "lucide-react";

const stats = [
  {
    label: "% de Ocupación",
    value: "78%",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    accent: "gradient-primary",
  },
  {
    label: "Pacientes Nuevos este Mes",
    value: "12",
    icon: UserPlus,
    color: "text-success",
    bg: "bg-success/10",
    accent: "bg-success",
  },
  {
    label: "Citas Agendadas Hoy",
    value: "6",
    icon: CalendarCheck,
    color: "text-accent",
    bg: "bg-accent/10",
    accent: "bg-accent",
  },
];

const StatsBoard = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5"
        >
          <CardContent className="flex flex-col items-start gap-3 p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-bold font-display text-card-foreground">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
            {/* Accent bar */}
            <div className={`h-1 w-12 rounded-full ${stat.accent}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsBoard;
