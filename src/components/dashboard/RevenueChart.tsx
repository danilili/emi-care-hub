import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import type { ResumenDiario } from "@/hooks/useResumenDiario";

interface RevenueChartProps {
  data: ResumenDiario[];
}

const formatDate = (fecha: string | null) => {
  if (!fecha) return "";
  return format(parseISO(fecha), "dd MMM", { locale: es });
};

const formatCurrency = (value: number) =>
  value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/90 backdrop-blur-md px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-card-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Ingreso:{" "}
        <span className="font-mono font-semibold text-primary">
          {formatCurrency(payload[0].value)}
        </span>
      </p>
    </div>
  );
};

const RevenueChart = ({ data }: RevenueChartProps) => {
  const chartData = data.map((r) => ({
    fecha: formatDate(r.fecha),
    dinero: r.dinero_gestionado ?? 0,
  }));

  return (
    <Card className="border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ingreso Gestionado por Día
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
              />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar
                dataKey="dinero"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
