import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavTabs } from "@/components/NavTabs";
import UserMenu from "@/components/UserMenu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Brain, Inbox, Check, X, Loader2, Eye } from "lucide-react";

interface PaymentSubmission {
  id: string;
  amount_reported: number | null;
  proof_url: string | null;
  created_at: string;
  patient_id: string;
  patients: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    balance_due: number | null;
  } | null;
}

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n));

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const Pagos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_submissions")
        .select(
          "id, amount_reported, proof_url, created_at, patient_id, patients(first_name, last_name, phone, balance_due)"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentSubmission[];
    },
  });

  const approve = useMutation({
    mutationFn: async (sub: PaymentSubmission) => {
      // Saldar primero (si falla, la submission queda pending y se reintenta).
      const { error: e1 } = await (supabase as any)
        .from("patients")
        .update({ balance_due: 0 })
        .eq("id", sub.patient_id);
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any)
        .from("payment_submissions")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", sub.id)
        .eq("status", "pending");
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast({ title: "Pago aprobado", description: "El saldo del paciente quedó en $0." });
      qc.invalidateQueries({ queryKey: ["pending-payments"] });
    },
    onError: (e: any) =>
      toast({ title: "Error al aprobar", description: e.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: async (sub: PaymentSubmission) => {
      const { error } = await (supabase as any)
        .from("payment_submissions")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", sub.id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Comprobante rechazado" });
      qc.invalidateQueries({ queryKey: ["pending-payments"] });
    },
    onError: (e: any) =>
      toast({ title: "Error al rechazar", description: e.message, variant: "destructive" }),
  });

  const busyId = approve.isPending
    ? approve.variables?.id
    : reject.isPending
    ? reject.variables?.id
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm sm:h-10 sm:w-10">
                <Brain className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold text-card-foreground truncate sm:text-xl">
                  Pagos pendientes
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Revisa los comprobantes que Emi recibió y confirma cada pago.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UserMenu config={null} />
            </div>
          </div>
          <div className="mt-3">
            <NavTabs />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Error al cargar los pagos pendientes.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          data.map((sub) => (
            <PaymentCard
              key={sub.id}
              sub={sub}
              busy={busyId === sub.id}
              onApprove={() => approve.mutate(sub)}
              onReject={() => reject.mutate(sub)}
            />
          ))
        )}
      </main>
    </div>
  );
};

function PaymentCard({
  sub,
  busy,
  onApprove,
  onReject,
}: {
  sub: PaymentSubmission;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { toast } = useToast();
  const [proofOpen, setProofOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const name = [sub.patients?.first_name, sub.patients?.last_name].filter(Boolean).join(" ") || "Paciente";
  const owed = sub.patients?.balance_due ?? null;
  const reported = sub.amount_reported;
  const mismatch = owed != null && reported != null && Number(owed) !== Number(reported);

  const viewProof = async () => {
    if (!sub.proof_url) {
      toast({ title: "Sin comprobante", description: "Este registro no tiene imagen adjunta.", variant: "destructive" });
      return;
    }
    setLoadingProof(true);
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(sub.proof_url, 3600);
    setLoadingProof(false);
    if (error || !data?.signedUrl) {
      toast({ title: "No se pudo abrir el comprobante", description: error?.message, variant: "destructive" });
      return;
    }
    setProofUrl(data.signedUrl);
    setProofOpen(true);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-card-foreground">{name}</h3>
            {sub.patients?.phone && (
              <span className="text-xs text-muted-foreground">· {sub.patients.phone}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Saldo: <span className="font-medium text-foreground">{fmtMoney(owed)}</span>
            </span>
            <span className="text-muted-foreground">
              Comprobante dice: <span className="font-medium text-foreground">{fmtMoney(reported)}</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Recibido {fmtDate(sub.created_at)}</p>
          {mismatch && (
            <p className="text-xs text-amber-600">
              ⚠️ El monto del comprobante no coincide con el saldo. Revísalo antes de aprobar.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={viewProof} disabled={loadingProof}>
            {loadingProof ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
            Ver comprobante
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={busy} className="text-destructive hover:text-destructive">
                <X className="mr-1 h-4 w-4" /> Rechazar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar este comprobante?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se marcará como rechazado y el saldo de {name} se mantiene. No se le avisa al paciente automáticamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onReject}>Rechazar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={busy}>
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                Aprobar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Aprobar el pago de {name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Confirmas que recibiste el pago. El saldo de {name} ({fmtMoney(owed)}) quedará en $0.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onApprove}>Aprobar pago</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprobante de {name}</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <img src={proofUrl} alt="Comprobante de pago" className="max-h-[70vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
      <Inbox className="h-7 w-7 text-muted-foreground" />
    </div>
    <h3 className="font-display text-lg font-semibold text-card-foreground">Sin pagos pendientes</h3>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      Cuando un paciente envíe un comprobante por WhatsApp, aparecerá aquí para que lo confirmes.
    </p>
  </div>
);

export default Pagos;
