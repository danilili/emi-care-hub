import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MessageCircleReply, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// "Retomar conversaciones": lista los mensajes de pacientes registrados que Emi ignoró
// mientras estaba apagada (o en modo solo recordatorios) y, con un clic, los reinyecta
// al MAIN uno por uno (con disculpa previa). La respuesta de Emi se lee de replay_log.
// Spec: Multi-tenancy/docs/spec-retomar-conversaciones.md

interface IgnoredMsg { id: string; text: string; at: string; motivo: string }
interface Resumable {
  phone: string;
  raw_phone: string;
  patient_id: string;
  patient_name: string;
  messages: IgnoredMsg[];
  first_at: string;
  last_at: string;
  luz_replied: boolean;
  luz_thread: boolean;
  ignored_ids: string[];
}
interface ReplayRow {
  id: string;
  phone: string;
  patient_name: string | null;
  status: string;
  emi_reply: string | null;
  reply_at: string | null;
  created_at: string;
}

interface Props { therapistId: string; agentOn: boolean }

const WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_RETOMAR as string | undefined;
const HOURS = 48;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

const ResumeConversations = ({ therapistId, agentOn }: Props) => {
  const [items, setItems] = useState<Resumable[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<string | null>(null);
  const [log, setLog] = useState<ReplayRow[]>([]);
  const pollRef = useRef<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.rpc("get_resumable_conversations", { p_therapist_id: therapistId, p_hours: HOURS });
    setLoading(false);
    if (error) { toast.error("No pude cargar las conversaciones pendientes"); return; }
    const rows = (data ?? []) as Resumable[];
    setItems(rows);
    // Preselecciona solo las que Luz NO ha contestado a mano
    const sel: Record<string, boolean> = {};
    rows.forEach((r) => { sel[r.phone] = !r.luz_replied && !r.luz_thread; });
    setSelected(sel);
  }, [therapistId, sb]);

  useEffect(() => { load(); }, [load, agentOn]);

  const stopPolling = () => { if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPolling(), []);

  const pollLog = useCallback(async (since: string) => {
    const { data } = await sb
      .from("replay_log")
      .select("id, phone, patient_name, status, emi_reply, reply_at, created_at")
      .eq("therapist_id", therapistId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as ReplayRow[];
    setLog(rows);
    const pending = rows.some((r) => r.status === "queued" || r.status === "sent");
    if (rows.length > 0 && !pending) stopPolling();
  }, [therapistId, sb]);

  const handleResume = async () => {
    const phones = items.filter((i) => selected[i.phone]).map((i) => i.phone);
    if (phones.length === 0) { toast.info("Selecciona al menos una conversación"); return; }
    if (!WEBHOOK) { toast.error("Falta configurar VITE_N8N_WEBHOOK_RETOMAR"); return; }
    setSending(true);
    const since = new Date().toISOString();
    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapist_id: therapistId, phones, hours: HOURS }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(`Emi va a retomar ${phones.length} conversación${phones.length === 1 ? "" : "es"}. Toma ~2 min por paciente.`);
      setRunStartedAt(since);
      setLog([]);
      stopPolling();
      pollRef.current = window.setInterval(() => pollLog(since), 8000);
      // La lista de pendientes se vacía conforme se marcan como reinyectadas
      window.setTimeout(load, 15000);
    } catch {
      toast.error("No se pudo iniciar. Intenta de nuevo en un momento.");
    } finally {
      setSending(false);
    }
  };

  const total = items.length;
  const nSel = items.filter((i) => selected[i.phone]).length;

  if (!agentOn && total === 0 && log.length === 0) return null;

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <MessageCircleReply className="h-5 w-5 text-primary" />
          Conversaciones pendientes
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={load} disabled={loading} aria-label="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mensajes de pacientes registrados que Emi no contestó mientras estaba apagada (últimas {HOURS} h).
          Al retomarlos, Emi se disculpa por la demora y responde como si acabaran de llegar.
          Las imágenes (comprobantes) no se pueden retomar: revísalas en tu WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 && (
          <p className="text-sm text-muted-foreground">No hay conversaciones pendientes.</p>
        )}

        {items.map((c) => (
          <label key={c.phone} className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3 cursor-pointer">
            <Checkbox
              className="mt-1"
              checked={!!selected[c.phone]}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, [c.phone]: v === true }))}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{c.patient_name || c.phone}</span>
                <span className="text-xs text-muted-foreground">{c.phone}</span>
                <span className="text-xs text-muted-foreground">· {fmt(c.last_at)}</span>
                {c.luz_replied && <Badge variant="secondary">Ya le contestaste tú</Badge>}
                {!c.luz_replied && c.luz_thread && <Badge variant="secondary">Conversación tuya</Badge>}
                <Badge variant="outline">{c.messages[c.messages.length - 1]?.motivo}</Badge>
              </div>
              <ul className="space-y-0.5">
                {c.messages.map((m) => (
                  <li key={m.id} className="text-sm text-foreground/90 truncate">“{m.text}”</li>
                ))}
              </ul>
            </div>
          </label>
        ))}

        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              {agentOn ? `${nSel} de ${total} seleccionada${nSel === 1 ? "" : "s"}` : "Enciende a Emi para poder retomarlas"}
            </p>
            <Button onClick={handleResume} disabled={!agentOn || sending || nSel === 0}>
              <Send className="mr-2 h-4 w-4" />
              Retomar {nSel > 0 ? nSel : ""} conversaci{nSel === 1 ? "ón" : "ones"}
            </Button>
          </div>
        )}

        {runStartedAt && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Respuestas de Emi</p>
            {log.length === 0 && <p className="text-xs text-muted-foreground">Preparando…</p>}
            {log.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{r.patient_name || r.phone}</span>
                  <Badge variant={r.status === "answered" ? "default" : r.status === "no_reply" ? "destructive" : "secondary"}>
                    {r.status === "queued" && "En cola"}
                    {r.status === "sent" && "Emi está contestando…"}
                    {r.status === "answered" && "Contestado"}
                    {r.status === "no_reply" && "Sin respuesta (revísalo)"}
                    {r.status === "error" && "Error"}
                  </Badge>
                  {r.reply_at && <span className="text-xs text-muted-foreground">{fmt(r.reply_at)}</span>}
                </div>
                {r.emi_reply && <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{r.emi_reply}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeConversations;
