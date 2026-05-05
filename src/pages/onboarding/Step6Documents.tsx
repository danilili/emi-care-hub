import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import FileUpload from "@/components/onboarding/FileUpload";

type Therapist = Tables<"therapists">;

const DOCUMENT_SLOTS = [
  {
    type: "privacy_policy",
    title: "Aviso de privacidad",
    helper: "Tu aviso de privacidad para que Emi lo comparta con los pacientes al primer contacto.",
  },
  {
    type: "cv",
    title: "Currículum",
    helper: "Tu CV. Emi puede usarlo para describir tu trayectoria profesional cuando un paciente pregunte.",
  },
  {
    type: "professional_license",
    title: "Cédula profesional",
    helper: "Imagen o PDF de tu cédula. Emi puede compartirla si un paciente pide validar tu profesión.",
  },
  {
    type: "consent_form",
    title: "Carta de consentimiento informado",
    helper: "El documento que firman tus pacientes al iniciar terapia.",
  },
  {
    type: "terms_of_service",
    title: "Términos y condiciones",
    helper: "Política del consultorio (cancelaciones, retrasos, confidencialidad, etc.).",
  },
] as const;

interface Step6Props {
  therapist: Therapist;
  onSaved: () => void;
}

const Step6Documents = ({ therapist, onSaved }: Step6Props) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaved();
      }}
      className="space-y-5"
    >
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Tus documentos</h2>
        <p className="text-sm text-muted-foreground">
          Sube los documentos que tengas a la mano. Todos son opcionales — puedes hacerlo después desde tu panel.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          {DOCUMENT_SLOTS.map((slot) => (
            <div key={slot.type} className="space-y-1.5">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-card-foreground">{slot.title}</p>
                <p className="text-xs text-muted-foreground">{slot.helper}</p>
              </div>
              <FileUpload
                therapistId={therapist.id}
                documentType={slot.type}
                title={slot.title}
                folder="documents"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button type="submit">
          Continuar <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default Step6Documents;
