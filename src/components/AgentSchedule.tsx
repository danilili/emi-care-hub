import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Power, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AgentScheduleProps {
  idInstancia: string;
}

const AgentSchedule = ({ idInstancia }: AgentScheduleProps) => {
  const [agentOn, setAgentOn] = useState(true);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [loading, setLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const load = async () => {
      if (!idInstancia) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("Configuracion_Clinica")
        .select("bot_encendido, trabaja_24_7, horario_inicio, horario_fin")
        .eq("id_instancia", idInstancia)
        .single();

      if (error) {
        toast.error("Error al cargar configuración");
        setLoading(false);
        return;
      }

      if (data) {
        setAgentOn(data.bot_encendido ?? true);
        setAllDay(data.trabaja_24_7 ?? false);
        setStartTime((data.horario_inicio ?? "09:00:00").slice(0, 5));
        setEndTime((data.horario_fin ?? "18:00:00").slice(0, 5));
      }
      setLoading(false);
    };
    load();
  }, [idInstancia]);

  const updateField = async (fields: Record<string, unknown>) => {
    const { error } = await supabase
      .from("Configuracion_Clinica")
      .update(fields)
      .eq("id_instancia", INSTANCIA);

    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Guardado", { duration: 1500 });
    }
  };

  const handleToggleAgent = (checked: boolean) => {
    setAgentOn(checked);
    updateField({ bot_encendido: checked });
  };

  const handleToggleAllDay = (checked: boolean) => {
    setAllDay(checked);
    updateField({ trabaja_24_7: checked });
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    if (field === "startTime") {
      setStartTime(value);
      updateField({ horario_inicio: value });
    } else {
      setEndTime(value);
      updateField({ horario_fin: value });
    }
  };

  if (loading) {
    return (
      <Card className="card-shadow">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horario del Agente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Agent toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${agentOn ? "gradient-primary" : "bg-muted"} transition-colors`}>
              <Power className={`h-4 w-4 ${agentOn ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div>
              <Label className="text-sm font-semibold">Estado del Agente</Label>
              <p className={`text-xs font-medium ${agentOn ? "text-success" : "text-muted-foreground"}`}>
                {agentOn ? "Encendido" : "Apagado"}
              </p>
            </div>
          </div>
          <Switch checked={agentOn} onCheckedChange={handleToggleAgent} />
        </div>

        {/* 24/7 toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${allDay ? "gradient-primary" : "bg-muted"} transition-colors`}>
              <RefreshCw className={`h-4 w-4 ${allDay ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div>
              <Label className="text-sm font-semibold">Trabajar 24/7</Label>
              <p className={`text-xs font-medium ${allDay ? "text-success" : "text-muted-foreground"}`}>
                {allDay ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
          <Switch checked={allDay} onCheckedChange={handleToggleAllDay} />
        </div>

        {/* Time selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start" className="text-xs font-medium text-muted-foreground">
              Inicio de jornada
            </Label>
            <input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => handleTimeChange("startTime", e.target.value)}
              disabled={allDay}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end" className="text-xs font-medium text-muted-foreground">
              Fin de jornada
            </Label>
            <input
              id="end"
              type="time"
              value={endTime}
              onChange={(e) => handleTimeChange("endTime", e.target.value)}
              disabled={allDay}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSchedule;
