import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Landmark, Loader2, Search, ShieldCheck, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserConfig } from "@/hooks/useUserConfig";
import { NavTabs } from "@/components/NavTabs";
import UserMenu from "@/components/UserMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

// Los tipos generados de Supabase aún no incluyen las columnas nuevas de
// therapist_config/patients; se usa (supabase as any) como en el resto del repo.

interface AjustesConfig {
  bank_name: string | null;
  bank_clabe: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  only_known_patients: boolean | null;
  exclusion_list_enabled: boolean | null;
}

interface PatientLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const patientName = (p: PatientLite) =>
  `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Sin nombre";

// ── Datos bancarios ───────────────────────────────────────────────────────────

function BankCard({ therapistId, config }: { therapistId: string; config: AjustesConfig }) {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState(config.bank_name ?? "");
  const [clabe, setClabe] = useState(config.bank_clabe ?? "");
  const [accountNumber, setAccountNumber] = useState(config.bank_account_number ?? "");
  const [holder, setHolder] = useState(config.bank_account_holder ?? "");
  const [saving, setSaving] = useState(false);

  const clabeInvalid = clabe.length > 0 && !/^\d{18}$/.test(clabe);

  const handleSave = async () => {
    if (clabeInvalid || saving) return;
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("therapist_config")
      .update({
        bank_name: bankName.trim() || null,
        bank_clabe: clabe || null,
        bank_account_number: accountNumber.trim() || null,
        bank_account_holder: holder.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("therapist_id", therapistId)
      .select("therapist_id");

    setSaving(false);
    if (error || !data?.length) {
      toast.error("Error al guardar los datos bancarios");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["ajustes-config"] });
    toast.success("Datos bancarios guardados", { duration: 1500 });
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Landmark className="h-5 w-5 text-primary" />
          Datos bancarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bank-name">Banco</Label>
            <Input
              id="bank-name"
              placeholder="BBVA, Santander, etc."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-clabe">CLABE</Label>
            <Input
              id="bank-clabe"
              placeholder="18 dígitos"
              inputMode="numeric"
              value={clabe}
              onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
            />
            {clabeInvalid && (
              <p className="text-xs text-destructive">La CLABE debe tener 18 dígitos.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-account">Número de cuenta</Label>
            <Input
              id="bank-account"
              placeholder="Opcional"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-holder">Titular</Label>
            <Input
              id="bank-holder"
              placeholder="Nombre del titular de la cuenta"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={clabeInvalid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Emi comparte estos datos a tus pacientes cuando piden pagar por transferencia.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Alcance de Emi ────────────────────────────────────────────────────────────

function ScopeCard({ therapistId, config }: { therapistId: string; config: AjustesConfig }) {
  const [onlyKnown, setOnlyKnown] = useState(config.only_known_patients ?? false);
  const [exclusionEnabled, setExclusionEnabled] = useState(config.exclusion_list_enabled ?? true);

  // Mismo patrón que AgentSchedule: verifica filas afectadas y revierte el toggle si falla.
  const updateField = async (fields: Record<string, unknown>) => {
    const { data, error } = await (supabase as any)
      .from("therapist_config")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("therapist_id", therapistId)
      .select("therapist_id");

    if (error || !data?.length) {
      toast.error("Error al guardar");
      return false;
    }
    toast.success("Guardado", { duration: 1500 });
    return true;
  };

  const handleOnlyKnown = async (checked: boolean) => {
    setOnlyKnown(checked);
    const ok = await updateField({ only_known_patients: checked });
    if (!ok) setOnlyKnown(!checked);
  };

  const handleExclusion = async (checked: boolean) => {
    setExclusionEnabled(checked);
    const ok = await updateField({ exclusion_list_enabled: checked });
    if (!ok) setExclusionEnabled(!checked);
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Alcance de Emi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-4">
          <div>
            <Label className="text-sm font-semibold">Atender solo pacientes registrados</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Los números que no están en tu lista de pacientes no recibirán respuesta de Emi
              (útil si tu línea mezcla vida personal).
            </p>
          </div>
          <Switch checked={onlyKnown} onCheckedChange={handleOnlyKnown} />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-4">
          <div>
            <Label className="text-sm font-semibold">Respetar lista de exclusión</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Los pacientes en la lista de abajo solo los atiendes tú.
            </p>
          </div>
          <Switch checked={exclusionEnabled} onCheckedChange={handleExclusion} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Lista de exclusión ────────────────────────────────────────────────────────

function ExclusionCard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PatientLite[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: excluded, isLoading } = useQuery({
    queryKey: ["excluded-patients"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("id, first_name, last_name, phone")
        .eq("exclude_from_bot", true)
        .order("first_name");
      if (error) throw error;
      return (data ?? []) as PatientLite[];
    },
  });

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const term = q.replace(/[%,()]/g, "");
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("id, first_name, last_name, phone")
        .eq("status", "active")
        .eq("exclude_from_bot", false)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .limit(8);
      setSearching(false);
      if (!error) setResults((data ?? []) as PatientLite[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const setExcluded = async (patient: PatientLite, value: boolean) => {
    const { data, error } = await (supabase as any)
      .from("patients")
      .update({ exclude_from_bot: value })
      .eq("id", patient.id)
      .select("id");

    if (error || !data?.length) {
      toast.error("Error al actualizar la lista");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["excluded-patients"] });
    if (value) {
      setSearch("");
      setResults([]);
      toast.success(`${patientName(patient)} agregado a la lista`, { duration: 1500 });
    } else {
      toast.success(`${patientName(patient)} quitado de la lista`, { duration: 1500 });
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <UserX className="h-5 w-5 text-primary" />
          Pacientes que Emi no atiende
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buscador para agregar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente por nombre para agregar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searching && <p className="text-xs text-muted-foreground">Buscando…</p>}
          {!searching && search.trim().length >= 2 && results.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin resultados.</p>
          )}
          {results.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setExcluded(p, true)}
                  className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {patientName(p)}
                    </p>
                    {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">Agregar</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista actual */}
        {isLoading ? (
          <Skeleton className="h-12 rounded-lg" />
        ) : excluded && excluded.length > 0 ? (
          <div className="space-y-2">
            {excluded.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {patientName(p)}
                  </p>
                  {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExcluded(p, false)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Quitar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay pacientes en la lista. Emi atiende a todos tus pacientes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Ajustes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: config, isLoading: configLoading } = useUserConfig();
  const isV2 = config?.stack === "v2";
  const therapistId = config?.id_cliente ?? "";

  const { data: ajustes, isLoading: ajustesLoading } = useQuery({
    queryKey: ["ajustes-config", therapistId],
    enabled: isV2 && Boolean(therapistId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("therapist_config")
        .select(
          "bank_name, bank_clabe, bank_account_number, bank_account_holder, only_known_patients, exclusion_list_enabled",
        )
        .eq("therapist_id", therapistId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AjustesConfig | null;
    },
  });

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
                  Ajustes
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <NavTabs />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {configLoading || (isV2 && ajustesLoading) ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : !isV2 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Disponible próximamente
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Esta sección aún no está disponible para tu cuenta.
            </p>
          </div>
        ) : !ajustes ? (
          <p className="text-sm text-destructive">Error al cargar tu configuración.</p>
        ) : (
          <div className="space-y-5">
            <BankCard therapistId={therapistId} config={ajustes} />
            <ScopeCard therapistId={therapistId} config={ajustes} />
            <ExclusionCard />
          </div>
        )}
      </main>
    </div>
  );
};

export default Ajustes;
