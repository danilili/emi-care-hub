// Notas libres del tenant (therapist_config.custom_prompt_additions): son CONTEXTO
// para el asistente, nunca instrucciones. Aquí se rechazan las frases que en producción
// hicieron que el asistente nombrara a la terapeuta o prometiera avisarle.

export const NOTES_LABEL = "Contexto para el asistente (no instrucciones)";

export const NOTES_HELP =
  "Describe tu enfoque, tu forma de trabajar o lo que quieres que el asistente tenga en cuenta. " +
  "No escribas instrucciones como “canaliza con…” o “le aviso a…”, ni nombres propios: " +
  "el asistente habla con la voz del consultorio y no menciona a nadie.";

const FORBIDDEN_PHRASES: { re: RegExp; label: string }[] = [
  { re: /canaliza(?:r|n|rlo|rla|rlas|rlos)?\s+con/i, label: "“canaliza con”" },
  { re: /le\s+avis[oa]\s+a/i, label: "“le aviso a”" },
  { re: /av[ií]s[ae](?:le|me|nle)?\s+a\b/i, label: "“avísale a”" },
  { re: /\bemi\b/i, label: "el nombre “Emi”" },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface TherapistNames {
  first_name?: string | null;
  last_name?: string | null;
  alias?: string | null;
}

/** Primer problema encontrado en la nota, o null si es aceptable. */
export const validateAssistantNotes = (text: string, names: TherapistNames = {}): string | null => {
  const t = text.trim();
  if (!t) return null;

  for (const f of FORBIDDEN_PHRASES) {
    if (f.re.test(t)) return `La nota contiene ${f.label}. Quítalo: el asistente no canaliza ni avisa, solo tiene contexto.`;
  }

  const candidates = [names.first_name, names.last_name, names.alias]
    .flatMap((n) => (n ?? "").split(/\s+/))
    .map((n) => n.trim())
    .filter((n) => n.length >= 3);

  for (const n of candidates) {
    if (new RegExp(`\\b${escapeRe(n)}\\b`, "i").test(t)) {
      return `La nota menciona “${n}”. El asistente no nombra a nadie: habla con la voz del consultorio.`;
    }
  }
  return null;
};
