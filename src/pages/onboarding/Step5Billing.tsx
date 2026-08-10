import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import FileUpload from "@/components/onboarding/FileUpload";

type Therapist = Tables<"therapists">;

const PAYMENT_TYPES = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
] as const;
type PaymentType = (typeof PAYMENT_TYPES)[number]["value"];

interface PaymentDraft {
  type: PaymentType | "";
  clabe?: string;
  banco?: string;
  terminal?: string;
  descripcion?: string;
}

const newPayment = (): PaymentDraft => ({ type: "" });

interface Step5Props {
  therapist: Therapist;
  onSaved: () => void;
}

const Step5Billing = ({ therapist, onSaved }: Step5Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<PaymentDraft[]>([]);
  const [wantsFiscal, setWantsFiscal] = useState(false);
  const [fiscalUploaded, setFiscalUploaded] = useState(false);
  // Cuenta bancaria (columnas nuevas de therapist_config; Emi la comparte para transferencias)
  const [bankName, setBankName] = useState("");
  const [bankClabe, setBankClabe] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  useEffect(() => {
    const load = async () => {
      const [configRes, docRes] = await Promise.all([
        // (supabase as any): los tipos generados aún no incluyen las columnas bancarias
        (supabase as any)
          .from("therapist_config")
          .select("payment_methods, bank_name, bank_clabe, bank_account_number, bank_account_holder")
          .eq("therapist_id", therapist.id)
          .maybeSingle(),
        supabase
          .from("therapist_documents")
          .select("id")
          .eq("therapist_id", therapist.id)
          .eq("document_type", "fiscal_certificate")
          .maybeSingle(),
      ]);

      if (configRes.error) {
        toast({ title: "Error al cargar cobro", description: configRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const methods = (configRes.data?.payment_methods as unknown as PaymentDraft[] | null) ?? [];
      setPayments(methods.length > 0 ? methods : [newPayment()]);

      setBankName(configRes.data?.bank_name ?? "");
      setBankClabe(configRes.data?.bank_clabe ?? "");
      setBankAccountNumber(configRes.data?.bank_account_number ?? "");
      setBankAccountHolder(configRes.data?.bank_account_holder ?? "");

      const hasFiscalDoc = Boolean(docRes.data);
      setFiscalUploaded(hasFiscalDoc);
      setWantsFiscal(hasFiscalDoc);

      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  const updatePayment = (idx: number, patch: Partial<PaymentDraft>) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addPayment = () => setPayments((prev) => [...prev, newPayment()]);

  const removePayment = (idx: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== idx));

  const validationError = (() => {
    if (payments.length === 0) return "Agrega al menos un método de cobro.";
    for (const [idx, p] of payments.entries()) {
      if (!p.type) return `Selecciona el tipo del método ${idx + 1}.`;
      if (p.type === "transferencia") {
        if (!p.clabe || !/^\d{18}$/.test(p.clabe)) {
          return `La CLABE del método ${idx + 1} debe tener 18 dígitos numéricos.`;
        }
        if (!p.banco?.trim()) return `Falta el banco en el método ${idx + 1}.`;
      }
      if (p.type === "tarjeta" && !p.terminal?.trim()) {
        return `Falta el nombre de la terminal en el método ${idx + 1}.`;
      }
      if (p.type === "otro" && !p.descripcion?.trim()) {
        return `Falta la descripción en el método ${idx + 1}.`;
      }
    }
    if (bankClabe.length > 0 && !/^\d{18}$/.test(bankClabe)) {
      return "La CLABE de tu cuenta bancaria debe tener 18 dígitos numéricos.";
    }
    if (wantsFiscal && !fiscalUploaded) {
      return "Sube tu constancia de situación fiscal o desactiva la opción de facturar.";
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;

    setSaving(true);
    try {
      const cleanPayments = payments.map((p) => {
        switch (p.type) {
          case "transferencia":
            return { type: p.type, clabe: p.clabe, banco: p.banco?.trim() };
          case "tarjeta":
            return { type: p.type, terminal: p.terminal?.trim() };
          case "otro":
            return { type: p.type, descripcion: p.descripcion?.trim() };
          case "efectivo":
            return { type: p.type };
          default:
            return p;
        }
      });

      // (supabase as any): los tipos generados aún no incluyen las columnas bancarias
      const { error } = await (supabase as any)
        .from("therapist_config")
        .update({
          payment_methods: cleanPayments as unknown as Json,
          bank_name: bankName.trim() || null,
          bank_clabe: bankClabe || null,
          bank_account_number: bankAccountNumber.trim() || null,
          bank_account_holder: bankAccountHolder.trim() || null,
        })
        .eq("therapist_id", therapist.id);

      if (error) throw error;
      onSaved();
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Cargando…
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Cobro y facturación</h2>
        <p className="text-sm text-muted-foreground">
          Cómo aceptas pagos y, opcionalmente, los datos para facturar.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Métodos de cobro
          </h3>

          {payments.map((p, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`pay-type-${idx}`}>Tipo *</Label>
                  <Select
                    value={p.type || undefined}
                    onValueChange={(v) =>
                      updatePayment(idx, {
                        type: v as PaymentType,
                        clabe: undefined,
                        banco: undefined,
                        terminal: undefined,
                        descripcion: undefined,
                      })
                    }
                  >
                    <SelectTrigger id={`pay-type-${idx}`}>
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {payments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePayment(idx)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar método"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {p.type === "transferencia" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`pay-clabe-${idx}`}>CLABE *</Label>
                    <Input
                      id={`pay-clabe-${idx}`}
                      placeholder="18 dígitos"
                      value={p.clabe ?? ""}
                      onChange={(e) =>
                        updatePayment(idx, { clabe: e.target.value.replace(/\D/g, "").slice(0, 18) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`pay-banco-${idx}`}>Banco *</Label>
                    <Input
                      id={`pay-banco-${idx}`}
                      placeholder="BBVA, Santander, etc."
                      value={p.banco ?? ""}
                      onChange={(e) => updatePayment(idx, { banco: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {p.type === "tarjeta" && (
                <div className="space-y-1.5">
                  <Label htmlFor={`pay-terminal-${idx}`}>Terminal *</Label>
                  <Input
                    id={`pay-terminal-${idx}`}
                    placeholder="Clip, Mercado Pago Point, etc."
                    value={p.terminal ?? ""}
                    onChange={(e) => updatePayment(idx, { terminal: e.target.value })}
                  />
                </div>
              )}

              {p.type === "otro" && (
                <div className="space-y-1.5">
                  <Label htmlFor={`pay-desc-${idx}`}>Descripción *</Label>
                  <Input
                    id={`pay-desc-${idx}`}
                    placeholder="Cómo se realiza este pago"
                    value={p.descripcion ?? ""}
                    onChange={(e) => updatePayment(idx, { descripcion: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addPayment} className="w-full">
            <Plus className="mr-1 h-4 w-4" /> Agregar método de cobro
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Cuenta bancaria
            </h3>
            <p className="text-xs text-muted-foreground">
              Emi comparte estos datos a tus pacientes cuando piden pagar por transferencia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
                value={bankClabe}
                onChange={(e) => setBankClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank-account">Número de cuenta</Label>
              <Input
                id="bank-account"
                placeholder="Opcional"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank-holder">Titular</Label>
              <Input
                id="bank-holder"
                placeholder="Nombre del titular de la cuenta"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Datos fiscales
              </h3>
              <p className="text-xs text-muted-foreground">
                Activa esto si quieres facturar tus sesiones.
              </p>
            </div>
            <Switch
              checked={wantsFiscal}
              onCheckedChange={(v) => {
                setWantsFiscal(v);
                if (!v) setFiscalUploaded(false);
              }}
            />
          </div>

          {wantsFiscal && (
            <div className="space-y-2 pt-2">
              <Label>Constancia de situación fiscal</Label>
              <FileUpload
                therapistId={therapist.id}
                documentType="fiscal_certificate"
                title="Constancia de situación fiscal"
                folder="fiscal"
                accept="application/pdf,image/*"
                onChanged={(uploaded) => setFiscalUploaded(uploaded)}
              />
              <p className="text-xs text-muted-foreground">
                Sube tu constancia (PDF o imagen). Nuestro equipo la procesa y configura tu facturación. No necesitas capturar los datos a mano.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {validationError && <p className="text-sm text-destructive">{validationError}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={Boolean(validationError) || saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar y continuar <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default Step5Billing;
