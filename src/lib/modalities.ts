export const MODALITIES = [
  { value: "in_person", label: "Presencial" },
  { value: "virtual", label: "En línea" },
  { value: "home_visit", label: "A domicilio" },
] as const;

export type Modality = (typeof MODALITIES)[number]["value"];

export const MODALITY_LABEL: Record<string, string> = Object.fromEntries(
  MODALITIES.map((m) => [m.value, m.label]),
);

export const modalityLabel = (m: string | null | undefined) =>
  m ? MODALITY_LABEL[m] ?? m : "Cualquier modalidad";
