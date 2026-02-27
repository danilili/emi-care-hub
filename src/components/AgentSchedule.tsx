import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Power } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = "https://YOUR_N8N_WEBHOOK_URL/agent-schedule";

const AgentSchedule = () => {
  const [agentOn, setAgentOn] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [sending, setSending] = useState(false);

  const sendWebhook = async (data: Record<string, unknown>) => {
    setSending(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Configuración enviada correctamente");
    } catch {
      toast.error("Error al enviar la configuración");
    } finally {
      setSending(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setAgentOn(checked);
    sendWebhook({ agentActive: checked, startTime, endTime });
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    if (field === "startTime") setStartTime(value);
    else setEndTime(value);
    sendWebhook({
      agentActive: agentOn,
      startTime: field === "startTime" ? value : startTime,
      endTime: field === "endTime" ? value : endTime,
    });
  };

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horario del Agente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
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
          <Switch checked={agentOn} onCheckedChange={handleToggle} disabled={sending} />
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
              disabled={sending}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              disabled={sending}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSchedule;
