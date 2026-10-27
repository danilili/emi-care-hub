// Reglas de primera consulta por tenant (therapist_config): anticipo, intake y
// mínimo de anticipación. Defaults = comportamiento actual (todo apagado).
// El trigger trg_apply_first_visit_rules usa estos campos al crear/mover citas;
// la app solo los configura, nunca recalcula citas existentes.

export type IntakeMode = "none" | "question" | "form";
export type DepositMode = "none" | "partial" | "full";
export type DepositAppliesTo = "first_visit" | "all";

export interface FirstVisitRules {
  intake_mode: IntakeMode;
  intake_question_text: string;
  intake_question_required: boolean;
  intake_form_url: string;
  intake_form_required: boolean;
  intake_form_deadline_days: number | null;
  deposit_mode: DepositMode;
  /** "percent" | "amount": cuál de los dos campos manda cuando deposit_mode = partial. */
  deposit_kind: "percent" | "amount";
  deposit_percent: number | null;
  deposit_amount: number | null;
  deposit_deadline_days: number | null;
  deposit_applies_to: DepositAppliesTo;
  first_visit_min_hours_advance: number | null;
  /** Solo cliente: la URL del formulario respondió en la última verificación. */
  form_url_verified: boolean;
}

export const FIRST_VISIT_RULES_COLUMNS =
  "intake_mode, intake_question_text, intake_question_required, intake_form_url, intake_form_required, intake_form_deadline_days, " +
  "deposit_mode, deposit_percent, deposit_amount, deposit_deadline_days, deposit_applies_to, first_visit_min_hours_advance";

export const INTAKE_MODE_LABEL: Record<IntakeMode, string> = {
  none: "No pedir nada",
  question: "Una pregunta por WhatsApp",
  form: "Formulario en mi sitio web",
};

export const DEPOSIT_MODE_LABEL: Record<DepositMode, string> = {
  none: "Sin anticipo",
  partial: "Anticipo parcial",
  full: "Pago completo por adelantado",
};

export const DEPOSIT_APPLIES_LABEL: Record<DepositAppliesTo, string> = {
  first_visit: "Solo primeras consultas",
  all: "Todas las citas",
};

export const defaultFirstVisitRules = (): FirstVisitRules => ({
  intake_mode: "none",
  intake_question_text: "",
  intake_question_required: false,
  intake_form_url: "",
  intake_form_required: false,
  intake_form_deadline_days: null,
  deposit_mode: "none",
  deposit_kind: "percent",
  deposit_percent: null,
  deposit_amount: null,
  deposit_deadline_days: null,
  deposit_applies_to: "first_visit",
  first_visit_min_hours_advance: null,
  form_url_verified: false,
});

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v !== "" && !isNaN(Number(v)) ? Number(v) : null;

/** Convierte la fila de therapist_config en el estado del formulario. */
export const rulesFromRow = (row: Record<string, unknown> | null | undefined): FirstVisitRules => {
  const d = defaultFirstVisitRules();
  if (!row) return d;
  const amount = num(row.deposit_amount);
  const percent = num(row.deposit_percent);
  const url = typeof row.intake_form_url === "string" ? row.intake_form_url : "";
  return {
    intake_mode: (["none", "question", "form"] as const).includes(row.intake_mode as IntakeMode)
      ? (row.intake_mode as IntakeMode)
      : "none",
    intake_question_text: typeof row.intake_question_text === "string" ? row.intake_question_text : "",
    intake_question_required: Boolean(row.intake_question_required),
    intake_form_url: url,
    intake_form_required: Boolean(row.intake_form_required),
    intake_form_deadline_days: num(row.intake_form_deadline_days),
    deposit_mode: (["none", "partial", "full"] as const).includes(row.deposit_mode as DepositMode)
      ? (row.deposit_mode as DepositMode)
      : "none",
    deposit_kind: amount !== null && percent === null ? "amount" : "percent",
    deposit_percent: percent,
    deposit_amount: amount,
    deposit_deadline_days: num(row.deposit_deadline_days),
    deposit_applies_to: row.deposit_applies_to === "all" ? "all" : "first_visit",
    first_visit_min_hours_advance: num(row.first_visit_min_hours_advance),
    // Una URL ya guardada se considera verificada (se validó al guardarla).
    form_url_verified: Boolean(url),
  };
};

/** Lo que se escribe en therapist_config. Limpia los campos que no aplican al modo elegido. */
export const rulesToPatch = (r: FirstVisitRules) => {
  const intakeForm = r.intake_mode === "form";
  const intakeQuestion = r.intake_mode === "question";
  const deposit = r.deposit_mode !== "none";
  const partial = r.deposit_mode === "partial";
  return {
    intake_mode: r.intake_mode,
    intake_question_text: intakeQuestion ? r.intake_question_text.trim() || null : null,
    intake_question_required: intakeQuestion ? r.intake_question_required : false,
    intake_form_url: intakeForm ? r.intake_form_url.trim() || null : null,
    intake_form_required: intakeForm ? r.intake_form_required : false,
    intake_form_deadline_days: intakeForm ? r.intake_form_deadline_days : null,
    deposit_mode: r.deposit_mode,
    deposit_percent: partial && r.deposit_kind === "percent" ? r.deposit_percent : null,
    deposit_amount: partial && r.deposit_kind === "amount" ? r.deposit_amount : null,
    deposit_deadline_days: deposit ? r.deposit_deadline_days : null,
    deposit_applies_to: r.deposit_applies_to,
    first_visit_min_hours_advance: r.first_visit_min_hours_advance,
  };
};

export const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** Monto del anticipo para un precio dado, con la misma fórmula que el trigger. */
export const depositForPrice = (r: FirstVisitRules, price: number): number | null => {
  if (r.deposit_mode === "none") return null;
  if (r.deposit_mode === "full") return price;
  if (r.deposit_kind === "amount") return r.deposit_amount ?? null;
  if (r.deposit_percent === null) return null;
  return Math.round((price * r.deposit_percent) / 100);
};

/** Sugerencia: el mayor entre plazo del formulario y plazo del anticipo, en horas. */
export const suggestedMinHours = (r: FirstVisitRules): number | null => {
  const days: number[] = [];
  if (r.intake_mode === "form" && r.intake_form_deadline_days) days.push(r.intake_form_deadline_days);
  if (r.deposit_mode !== "none" && r.deposit_deadline_days) days.push(r.deposit_deadline_days);
  if (days.length === 0) return null;
  return Math.max(...days) * 24;
};

/** Primer error de validación, o null si todo está bien para guardar. */
export const validateFirstVisitRules = (r: FirstVisitRules): string | null => {
  if (r.intake_mode === "question" && !r.intake_question_text.trim()) {
    return "Escribe la pregunta que se le hará al consultante.";
  }
  if (r.intake_mode === "form") {
    if (!isHttpUrl(r.intake_form_url)) return "La URL del formulario debe empezar con https://";
    if (!r.form_url_verified) return "Verifica que la URL del formulario responda antes de activarlo.";
    if (r.intake_form_deadline_days !== null && r.intake_form_deadline_days < 0) {
      return "El plazo del formulario no puede ser negativo.";
    }
  }
  if (r.deposit_mode === "partial") {
    if (r.deposit_kind === "percent") {
      if (r.deposit_percent === null || r.deposit_percent <= 0 || r.deposit_percent > 100) {
        return "El porcentaje del anticipo debe estar entre 1 y 100.";
      }
    } else if (r.deposit_amount === null || r.deposit_amount <= 0) {
      return "El monto del anticipo debe ser mayor a cero.";
    }
  }
  if (r.deposit_mode !== "none" && r.deposit_deadline_days !== null && r.deposit_deadline_days < 0) {
    return "El plazo del anticipo no puede ser negativo.";
  }
  if (r.first_visit_min_hours_advance !== null && r.first_visit_min_hours_advance < 0) {
    return "La anticipación mínima no puede ser negativa.";
  }
  return null;
};

export const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
