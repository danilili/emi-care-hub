import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Brain, ClipboardList, LayoutDashboard, Inbox, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserConfig } from "@/hooks/useUserConfig";
import { useCitasPendientes, type Cita } from "@/hooks/useCitasPendientes";
import UserMenu from "@/components/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ── Row state ─────────────────────────────────────────────────────────────────

interface RowState {
  asistencia: string;
  pago: string;
  monto_adeudo: string;
  sending: boolean;
  confirmed: boolean;
}

const defaultRow = (): RowState => ({
  asistencia: "",
  pago: "",
  monto_adeudo: "0",
  sending: false,
  confirmed: false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(fecha: string) {
  return format(parseISO(fecha), "EEE d MMM", { locale: es });
}

function formatHora(hora: string) {
  // hora comes as "HH:MM:SS"
  return hora.slice(0, 5);
}

function ModalidadBadge({ modalidad }: { modalidad: string | null }) {
  const isVideo = modalidad === "Videollamada";
  return (
    <Badge
      variant="outline"
      className={
        isVideo
          ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
          : "border-sky-500/40 bg-sky-500/10 text-sky-400"
      }
    >
      {modalidad ?? "Presencial"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    "Por Confirmar": "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    Agendado: "border-border bg-muted/40 text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={map[status] ?? map["Agendado"]}>
      {status}
    </Badge>
  );
}

// ── Nav tabs (shared pattern) ──────────────────────────────────────────────────

function NavTabs() {
  const location = useLocation();
  const tabs = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/asistencias", label: "Asistencias", icon: ClipboardList },
  ];
  return (
    <nav className="mt-3 flex gap-1">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "gradient-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Cita card ─────────────────────────────────────────────────────────────────

interface CitaCardProps {
  cita: Cita;
  row: RowState;
  onChange: (updates: Partial<RowState>) => void;
  onConfirm: () => void;
}

function CitaCard({ cita, row, onChange, onConfirm }: CitaCardProps) {
  const esPresente = row.asistencia === "Presente";
  const esAdeudo = row.pago === "Adeudo";

  const canConfirm =
    !row.sending &&
    !row.confirmed &&
    row.asistencia !== "" &&
    (row.asistencia === "Falta" || row.pago !== "");

  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl shadow-md">
      <CardContent className="p-4 sm:p-5">
        {/* Info row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-card-foreground truncate">
              {cita.nombre_paciente} {cita.apellidos_paciente ?? ""}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatFecha(cita.fecha)} · {formatHora(cita.hora)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <ModalidadBadge modalidad={cita.modalidad} />
            <StatusBadge status={cita.status_cita} />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {/* Asistencia */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">Asistencia</label>
            <Select
              value={row.asistencia}
              onValueChange={(v) => onChange({ asistencia: v, pago: "", monto_adeudo: "0" })}
              disabled={row.confirmed || row.sending}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Presente">Presente</SelectItem>
                <SelectItem value="Falta">Falta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pago (solo si Presente) */}
          {esPresente && (
            <div className="flex flex-col gap-1 min-w-[170px]">
              <label className="text-xs font-medium text-muted-foreground">Pago</label>
              <Select
                value={row.pago}
                onValueChange={(v) => onChange({ pago: v, monto_adeudo: "0" })}
                disabled={row.confirmed || row.sending}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tipo de pago…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulta Individual">Consulta Individual</SelectItem>
                  <SelectItem value="Consulta Pareja">Consulta Pareja</SelectItem>
                  <SelectItem value="Adeudo">Adeudo</SelectItem>
                  <SelectItem value="Cortesía">Cortesía</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Monto adeudo (solo si Adeudo) */}
          {esPresente && esAdeudo && (
            <div className="flex flex-col gap-1 w-[110px]">
              <label className="text-xs font-medium text-muted-foreground">Monto adeudo</label>
              <Input
                type="number"
                min="0"
                value={row.monto_adeudo}
                onChange={(e) => onChange({ monto_adeudo: e.target.value })}
                disabled={row.confirmed || row.sending}
                className="h-9 text-sm"
                placeholder="$0"
              />
            </div>
          )}

          {/* Confirm button */}
          <div className="ml-auto">
            {row.confirmed ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Guardado
              </span>
            ) : (
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={!canConfirm}
                className="gradient-primary text-primary-foreground shadow-sm"
              >
                {row.sending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Asistencias = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: config } = useUserConfig();
  const idCliente = config?.id_cliente;

  const { data: citas, isLoading, isError } = useCitasPendientes(idCliente);

  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const getRow = (id: string): RowState => rowStates[id] ?? defaultRow();
  const updateRow = (id: string, updates: Partial<RowState>) =>
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRow(id), ...updates },
    }));

  const handleConfirm = async (cita: Cita) => {
    const row = getRow(cita.id);

    if (!row.asistencia) {
      toast.error("Selecciona si el paciente asistió");
      return;
    }
    if (row.asistencia === "Presente" && !row.pago) {
      toast.error("Selecciona el tipo de pago");
      return;
    }

    updateRow(cita.id, { sending: true });

    try {
      // 1. Actualizar en Supabase
      const updateData: Record<string, unknown> = {
        asistencia: row.asistencia,
        pago: row.asistencia === "Presente" ? row.pago : null,
        monto_adeudo: row.pago === "Adeudo" ? Number(row.monto_adeudo) : 0,
      };

      const { error: dbError } = await (supabase as any)
        .from("citas")
        .update(updateData)
        .eq("id", cita.id);

      if (dbError) throw dbError;

      // 2. POST al webhook de n8n
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS;
      if (webhookUrl && !webhookUrl.startsWith("PLACEHOLDER")) {
        const payload = {
          id_cita: cita.id,
          id_cita_externo: cita.id_cita_externo,
          telefono: cita.telefono,
          nombre_paciente: cita.nombre_paciente,
          apellidos_paciente: cita.apellidos_paciente,
          fecha: cita.fecha,
          asistencia: row.asistencia,
          pago: row.asistencia === "Presente" ? row.pago : null,
          monto_adeudo: row.pago === "Adeudo" ? Number(row.monto_adeudo) : 0,
          id_cliente: cita.id_cliente,
        };
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      toast.success(`Asistencia de ${cita.nombre_paciente} confirmada`);
      updateRow(cita.id, { sending: false, confirmed: true });
      // Refetch después de un breve momento para que el usuario vea el checkmark
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["citas-pendientes"] });
      }, 1200);
    } catch {
      toast.error("No se pudo guardar. Intenta de nuevo.");
      updateRow(cita.id, { sending: false });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm sm:h-10 sm:w-10">
                <Brain className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold text-card-foreground truncate sm:text-xl">
                  Lista de Asistencias
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {config?.nombre_comercial ?? "Cargando…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UserMenu config={config ?? null} />
            </div>
          </div>
          <NavTabs />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Citas pendientes de revisión
        </h2>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Error al cargar las citas.</p>
        )}

        {!isLoading && !isError && citas?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Sin pendientes
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Todas las citas de los últimos días ya tienen asistencia registrada.
            </p>
          </div>
        )}

        {!isLoading && citas && citas.length > 0 && (
          <div className="space-y-3">
            {citas.map((cita) => (
              <CitaCard
                key={cita.id}
                cita={cita}
                row={getRow(cita.id)}
                onChange={(updates) => updateRow(cita.id, updates)}
                onConfirm={() => handleConfirm(cita)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Asistencias;
