import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = "https://YOUR_N8N_WEBHOOK_URL/emergency-protocol";

const EmergencyProtocol = () => {
  const [daysAbsent, setDaysAbsent] = useState("");
  const [resumeDate, setResumeDate] = useState("");
  const [sending, setSending] = useState(false);

  const handleActivate = async () => {
    if (!daysAbsent || !resumeDate) {
      toast.error("Completa todos los campos");
      return;
    }
    setSending(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysAbsent: Number(daysAbsent), resumeDate }),
      });
      toast.success("Protocolo de emergencia activado");
    } catch {
      toast.error("Error al activar el protocolo");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Protocolo de Emergencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="days" className="text-xs font-medium text-muted-foreground">
            Días de ausencia
          </Label>
          <Input
            id="days"
            type="number"
            min="1"
            placeholder="Ej: 5"
            value={daysAbsent}
            onChange={(e) => setDaysAbsent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resume" className="text-xs font-medium text-muted-foreground">
            Fecha de reanudación
          </Label>
          <Input
            id="resume"
            type="date"
            value={resumeDate}
            onChange={(e) => setResumeDate(e.target.value)}
          />
        </div>
        <Button
          variant="destructive"
          className="w-full font-semibold"
          onClick={handleActivate}
          disabled={sending}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          {sending ? "Activando..." : "Activar Protocolo"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmergencyProtocol;
