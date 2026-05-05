import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

type Therapist = Tables<"therapists">;

interface Step1Props {
  therapist: Therapist;
  onSaved: (updated: Partial<Therapist>) => void;
}

const Step1Identity = ({ therapist, onSaved }: Step1Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(therapist.first_name);
  const [lastName, setLastName] = useState(therapist.last_name);
  const [profession, setProfession] = useState(therapist.profession);
  const [brandName, setBrandName] = useState(therapist.brand_name);

  const [tone, setTone] = useState(therapist.tone);
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [phone, setPhone] = useState(therapist.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(therapist.website_url ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(therapist.google_maps_url ?? "");

  // Soft-lock: identity fields become read-only after first save (when therapist.first_name is set).
  const identityLocked = Boolean(therapist.first_name);

  const canSave =
    firstName.trim() &&
    lastName.trim() &&
    profession.trim() &&
    brandName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    try {
      const updates = identityLocked
        ? {
            tone: tone.trim() || "professional and warm",
            bio: bio.trim() || null,
            phone: phone.trim() || null,
            website_url: websiteUrl.trim() || null,
            google_maps_url: googleMapsUrl.trim() || null,
          }
        : {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            profession: profession.trim(),
            brand_name: brandName.trim(),
            tone: tone.trim() || "professional and warm",
            bio: bio.trim() || null,
            phone: phone.trim() || null,
            website_url: websiteUrl.trim() || null,
            google_maps_url: googleMapsUrl.trim() || null,
          };

      const { error } = await supabase
        .from("therapists")
        .update(updates)
        .eq("id", therapist.id);

      if (error) throw error;
      onSaved(updates);
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 space-y-1">
          <h2 className="font-display text-xl font-bold">Tu identidad</h2>
          <p className="text-sm text-muted-foreground">
            {identityLocked
              ? "Los datos marcados como bloqueados solo se modifican contactando a soporte."
              : "Una vez guardados, tu nombre, apellido, profesión y nombre comercial solo podrás cambiarlos contactando a soporte."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">
                Nombre * {identityLocked && <span className="text-xs text-muted-foreground">(bloqueado)</span>}
              </Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={identityLocked}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">
                Apellido * {identityLocked && <span className="text-xs text-muted-foreground">(bloqueado)</span>}
              </Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={identityLocked}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profession">
              Profesión * {identityLocked && <span className="text-xs text-muted-foreground">(bloqueado)</span>}
            </Label>
            <Input
              id="profession"
              placeholder="Psicólogo clínico"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={identityLocked}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand_name">
              Nombre comercial / consultorio * {identityLocked && <span className="text-xs text-muted-foreground">(bloqueado)</span>}
            </Label>
            <Input
              id="brand_name"
              placeholder="Consultorio Salud Mental"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={identityLocked}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tone">Tono del asistente</Label>
            <Input
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="cercano y profesional"
            />
            <p className="text-xs text-muted-foreground">
              Cómo quieres que Emi se dirija a tus pacientes.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Sobre ti</Label>
            <Textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Una breve presentación profesional. Emi puede compartirla cuando un paciente pregunte por ti."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Tu teléfono de contacto</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="55 1234 5678"
            />
            <p className="text-xs text-muted-foreground">
              Para que el equipo de Emi se comunique contigo. No es el número que usará el bot con tus pacientes.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maps">Ubicación en Google Maps</Label>
            <Input
              id="maps"
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!canSave || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar y continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Step1Identity;
