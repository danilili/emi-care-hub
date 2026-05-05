import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Json } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

type Therapist = Tables<"therapists">;

const MODALITIES = [
  { value: "in_person", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "home_visit", label: "A domicilio" },
] as const;
type Modality = (typeof MODALITIES)[number]["value"];

interface VariantDraft {
  modality: Modality | "";
  duration_minutes: number;
  price: string;
}

interface ServiceDraft {
  name: string;
  description: string;
  variants: VariantDraft[];
}

interface Step2Props {
  therapist: Therapist;
  onSaved: () => void;
}

const newVariant = (used: Modality[] = []): VariantDraft => {
  const next = MODALITIES.find((m) => !used.includes(m.value));
  return {
    modality: next?.value ?? "",
    duration_minutes: 50,
    price: "",
  };
};

const newService = (): ServiceDraft => ({
  name: "",
  description: "",
  variants: [newVariant()],
});

const Step2Services = ({ therapist, onSaved }: Step2Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceDraft[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("therapist_services")
        .select("name, description, sort_order, service_variants(modality, duration_minutes, price)")
        .eq("therapist_id", therapist.id)
        .order("sort_order", { ascending: true });

      if (error) {
        toast({ title: "Error al cargar servicios", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setServices([newService()]);
      } else {
        setServices(
          data.map((s) => ({
            name: s.name,
            description: s.description ?? "",
            variants: (s.service_variants ?? []).map((v) => ({
              modality: v.modality as Modality,
              duration_minutes: v.duration_minutes,
              price: String(v.price),
            })),
          })),
        );
      }
      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  const updateService = (idx: number, patch: Partial<ServiceDraft>) => {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addService = () => setServices((prev) => [...prev, newService()]);

  const removeService = (idx: number) =>
    setServices((prev) => prev.filter((_, i) => i !== idx));

  const updateVariant = (sIdx: number, vIdx: number, patch: Partial<VariantDraft>) => {
    setServices((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? { ...s, variants: s.variants.map((v, j) => (j === vIdx ? { ...v, ...patch } : v)) }
          : s,
      ),
    );
  };

  const addVariant = (sIdx: number) => {
    setServices((prev) =>
      prev.map((s, i) => {
        if (i !== sIdx) return s;
        const used = s.variants.map((v) => v.modality).filter(Boolean) as Modality[];
        return { ...s, variants: [...s.variants, newVariant(used)] };
      }),
    );
  };

  const removeVariant = (sIdx: number, vIdx: number) => {
    setServices((prev) =>
      prev.map((s, i) =>
        i === sIdx ? { ...s, variants: s.variants.filter((_, j) => j !== vIdx) } : s,
      ),
    );
  };

  const validationError = (() => {
    if (services.length === 0) return "Agrega al menos un servicio.";
    for (const [sIdx, s] of services.entries()) {
      if (!s.name.trim()) return `El servicio #${sIdx + 1} necesita un nombre.`;
      if (s.variants.length === 0)
        return `"${s.name}" necesita al menos una modalidad.`;
      const seen = new Set<string>();
      for (const v of s.variants) {
        if (!v.modality)
          return `Selecciona la modalidad de cada variante en "${s.name}".`;
        if (seen.has(v.modality)) {
          const label = MODALITIES.find((m) => m.value === v.modality)?.label;
          return `"${s.name}" tiene la modalidad ${label} repetida.`;
        }
        seen.add(v.modality);
        const price = parseFloat(v.price);
        if (isNaN(price) || price <= 0)
          return `Cada variante necesita un precio mayor a 0 (revisa "${s.name}").`;
        if (!v.duration_minutes || v.duration_minutes <= 0)
          return `Cada variante necesita una duración mayor a 0 (revisa "${s.name}").`;
      }
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;

    setSaving(true);
    try {
      const payload = services.map((s) => ({
        name: s.name.trim(),
        description: s.description.trim(),
        variants: s.variants.map((v) => ({
          modality: v.modality,
          duration_minutes: v.duration_minutes,
          price: parseFloat(v.price),
        })),
      })) as unknown as Json;

      const { error } = await supabase.rpc("replace_therapist_services", {
        p_services: payload,
      });
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
          Cargando servicios…
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Tus servicios</h2>
        <p className="text-sm text-muted-foreground">
          Agrega cada tipo de sesión que ofreces. Un mismo servicio puede tener varias modalidades (presencial, virtual, a domicilio) con precios distintos.
        </p>
      </div>

      {services.map((service, sIdx) => {
        const usedModalities = service.variants
          .map((v) => v.modality)
          .filter(Boolean) as Modality[];
        const canAddVariant = MODALITIES.some((m) => !usedModalities.includes(m.value));

        return (
          <Card key={sIdx}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`service-name-${sIdx}`}>Nombre del servicio *</Label>
                  <Input
                    id={`service-name-${sIdx}`}
                    placeholder="Terapia individual"
                    value={service.name}
                    onChange={(e) => updateService(sIdx, { name: e.target.value })}
                  />
                </div>
                {services.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(sIdx)}
                    className="mt-7 text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar servicio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`service-desc-${sIdx}`}>Descripción</Label>
                <Textarea
                  id={`service-desc-${sIdx}`}
                  rows={2}
                  placeholder="Para qué sirve, a quién va dirigida…"
                  value={service.description}
                  onChange={(e) => updateService(sIdx, { description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Modalidades
                </Label>
                {service.variants.map((variant, vIdx) => {
                  const otherModalities = service.variants
                    .filter((_, j) => j !== vIdx)
                    .map((v) => v.modality)
                    .filter(Boolean) as Modality[];

                  return (
                    <div
                      key={vIdx}
                      className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-background/50 p-3"
                    >
                      <div className="flex-1 min-w-[140px] space-y-1">
                        <Label className="text-xs">Modalidad *</Label>
                        <Select
                          value={variant.modality || undefined}
                          onValueChange={(value) =>
                            updateVariant(sIdx, vIdx, { modality: value as Modality })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                          <SelectContent>
                            {MODALITIES.map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value}
                                disabled={otherModalities.includes(m.value)}
                              >
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Duración (min)</Label>
                        <Input
                          type="number"
                          min={5}
                          step={5}
                          value={variant.duration_minutes}
                          onChange={(e) =>
                            updateVariant(sIdx, vIdx, {
                              duration_minutes: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Precio (MXN) *</Label>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          placeholder="900"
                          value={variant.price}
                          onChange={(e) => updateVariant(sIdx, vIdx, { price: e.target.value })}
                        />
                      </div>
                      {service.variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(sIdx, vIdx)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar modalidad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addVariant(sIdx)}
                  disabled={!canAddVariant}
                  className="text-primary"
                >
                  <Plus className="mr-1 h-4 w-4" /> Agregar modalidad
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" variant="outline" onClick={addService} className="w-full">
        <Plus className="mr-1 h-4 w-4" /> Agregar otro servicio
      </Button>

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={Boolean(validationError) || saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar y continuar <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default Step2Services;
