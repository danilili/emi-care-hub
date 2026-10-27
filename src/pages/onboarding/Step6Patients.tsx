import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/onboarding/FileUpload";

type Therapist = Tables<"therapists">;

// Cómo entran los pacientes que ya tiene el consultorio. Se guarda en
// therapist_config.patient_import_mode; el archivo (si lo hay) queda en
// therapist_documents con document_type = patient_import para que el equipo lo procese.

export type PatientImportMode = "none" | "file" | "google_contacts" | "calendar";

export const PATIENT_IMPORT_OPTIONS: { value: PatientImportMode; title: string; help: string }[] = [
  {
    value: "none",
    title: "No importar nada",
    help: "Consultorio nuevo o prefieres empezar de cero. Cada consultante se registra solo al escribir por primera vez.",
  },
  {
    value: "file",
    title: "Subir un archivo de contactos",
    help: "Exporta tus contactos (CSV o vCard del teléfono) y súbelo aquí. Normalizamos los teléfonos y te mostramos la lista antes de darla de alta.",
  },
  {
    value: "google_contacts",
    title: "Conectar Google Contacts",
    help: "Importamos los contactos de tu cuenta de Google, idealmente los que tengas etiquetados como pacientes. Te pediremos el acceso al activar tu cuenta.",
  },
  {
    value: "calendar",
    title: "Solo desde mi calendario",
    help: "No importamos contactos. Los pacientes con citas futuras en tu Google Calendar se van dando de alta conforme aparecen sus citas.",
  },
];

export const PATIENT_IMPORT_LABEL: Record<PatientImportMode, string> = Object.fromEntries(
  PATIENT_IMPORT_OPTIONS.map((o) => [o.value, o.title]),
) as Record<PatientImportMode, string>;

interface Step6PatientsProps {
  therapist: Therapist;
  onSaved: () => void;
}

const Step6Patients = ({ therapist, onSaved }: Step6PatientsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<PatientImportMode>("none");
  const [fileUploaded, setFileUploaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cfgRes, docRes] = await Promise.all([
        supabase.from("therapist_config").select("patient_import_mode").eq("therapist_id", therapist.id).maybeSingle(),
        supabase
          .from("therapist_documents")
          .select("id")
          .eq("therapist_id", therapist.id)
          .eq("document_type", "patient_import")
          .maybeSingle(),
      ]);
      if (cfgRes.error) {
        toast({ title: "Error al cargar", description: cfgRes.error.message, variant: "destructive" });
      } else {
        const m = cfgRes.data?.patient_import_mode;
        if (PATIENT_IMPORT_OPTIONS.some((o) => o.value === m)) setMode(m as PatientImportMode);
      }
      setFileUploaded(Boolean(docRes.data));
      setLoading(false);
    };
    load();
  }, [therapist.id, toast]);

  const validationError = mode === "file" && !fileUploaded ? "Sube el archivo de contactos o elige otra opción." : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("therapist_config")
        .update({ patient_import_mode: mode })
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
        <CardContent className="p-12 text-center text-muted-foreground">Cargando…</CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Tus pacientes actuales</h2>
        <p className="text-sm text-muted-foreground">
          ¿Cómo quieres que entren al sistema los pacientes que ya atiendes? Puedes cambiarlo después.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          {PATIENT_IMPORT_OPTIONS.map((o) => {
            const selected = mode === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setMode(o.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
                aria-pressed={selected}
              >
                <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-card-foreground")}>{o.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{o.help}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {mode === "file" && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <Label>Archivo de contactos</Label>
            <FileUpload
              therapistId={therapist.id}
              documentType="patient_import"
              title="Contactos para importar"
              folder="patients"
              accept=".csv,.vcf,text/csv,text/vcard,text/x-vcard,text/plain"
              maxSizeMB={20}
              onChanged={setFileUploaded}
            />
            <p className="text-xs text-muted-foreground">
              iPhone: Contactos → selecciona varios → Compartir → vCard. Android o Google: Contactos → Exportar → CSV.
              Si solo algunos contactos son pacientes, márcalos antes (por ejemplo con “(paciente)” en el nombre o una etiqueta).
            </p>
          </CardContent>
        </Card>
      )}

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

export default Step6Patients;
