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

// Detección de stack: si el usuario logueado tiene tenant en `therapists` (por email),
// el switch opera el V2 (`therapist_config.bot_enabled`); si no —caso Reyes hasta su
// cutover— opera el V1 (`Configuracion_Clinica.bot_encendido`) como siempre.
type StackMode = "v1" | "v2";

const AgentSchedule = ({ idInstancia }: AgentScheduleProps) => {
  const [mode, setMode] = useState<StackMode>("v1");
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [agentOn, setAgentOn] = useState(true);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [loading, setLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // ¿Tenant V2? (en el modelo V2, therapists.id === auth.uid(); RLS solo permite ver la fila propia)
      if (user?.id) {
        const { data: therapist } = await supabase
          .from("therapists")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (therapist?.id) {
          const { data: cfg, error } = await supabase
            .from("therapist_config")
            .select("bot_enabled, works_24_7")
            .eq("therapist_id", therapist.id)
            .maybeSingle();

          if (error) {
            toast.error("Error al cargar configuración");
          } else if (cfg) {
            setMode("v2");
            setTherapistId(therapist.id);
            setAgentOn(cfg.bot_enabled ?? true);
            setAllDay(cfg.works_24_7 ?? true);
          }
          setLoading(false);
          return;
        }
      }

      // Fallback V1 (Reyes, hasta el cutover)
      if (!idInstancia) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("Configuracion_Clinica")
        .select("bot_encendido, trabaja_24_7, horario_inicio, horario_fin")
        .eq("id_instancia", idInstancia)
        .maybeSingle();

      if (error) {
        toast.error("Error al cargar configuración");
        setLoading(false);
        return;
      }

      if (data) {
        setAgentOn(data.bot_encendido ?? true);
        setAllDay(data.trabaja_24_7 ?? true);
        setStartTime((data.horario_inicio ?? "09:00:00").slice(0, 5));
        setEndTime((data.horario_fin ?? "18:00:00").slice(0, 5));
      }
      setLoading(false);
    };
    load();
  }, [idInstancia]);

  // Un solo punto de escritura; verifica filas afectadas para no reportar
  // "Guardado" cuando el UPDATE no tocó nada (bug histórico del toast mentiroso).
  const updateField = async (v1Fields: Record<string, unknown>, v2Fields: Record<string, unknown>) => {
    if (mode === "v2" && therapistId) {
      const { data, error } = await supabase
        .from("therapist_config")
        .update({ ...v2Fields, updated_at: new Date().toISOString() })
        .eq("therapist_id", therapistId)
        .select("therapist_id");

      if (error || !data?.length) {
        toast.error("Error al guardar");
        return false;
      }
    } else {
      const { data, error } = await supabase
        .from("Configuracion_Clinica")
        .update(v1Fields)
        .eq("id_instancia", idInstancia)
        .select("id_instancia");

      if (error || !data?.length) {
        toast.error("Error al guardar");
        return false;
      }
    }
    toast.success("Guardado", { duration: 1500 });
    return true;
  };

  const handleToggleAgent = async (checked: boolean) => {
    setAgentOn(checked);
    const ok = await updateField({ bot_encendido: checked }, { bot_enabled: checked });
    if (!ok) setAgentOn(!checked);
  };

  const handleToggleAllDay = async (checked: boolean) => {
    setAllDay(checked);
    const ok = await updateField({ trabaja_24_7: checked }, { works_24_7: checked });
    if (!ok) setAllDay(!checked);
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    if (field === "startTime") {
      setStartTime(value);
      updateField({ horario_inicio: value }, {});
    } else {
      setEndTime(value);
      updateField({ horario_fin: value }, {});
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

        {/* Time selectors — solo stack V1; en V2 los horarios viven en therapist_schedules (por día) */}
        {mode === "v1" ? (
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
        ) : (
          !allDay && (
            <p className="text-xs text-muted-foreground">
              Tus horarios por día se configuran en tu perfil; Emi los respeta automáticamente.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default AgentSchedule;
