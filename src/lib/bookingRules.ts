import type { Json } from "@/integrations/supabase/types";

// therapist_config.booking_rules (jsonb). Lo leen Check_Availability y Agendar.
// Pendiente lado Emi (bitácora 25-oct): Check_Availability aún no aplica min_hours_advance.

export interface BookingRules {
  slot_minutes: number;
  min_hours_advance: number;
  /** La anticipación mínima salta los días de non_business_days. */
  min_hours_business_only: boolean;
  /** 0 = domingo … 6 = sábado. */
  non_business_days: number[];
  max_days_advance: number;
  /** "HH:MM" o "" = sin regla. */
  no_booking_same_day_after: string;
  block_next_day_dow: number | null;
  /** "HH:MM" o "". */
  block_next_day_time: string;
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  slot_minutes: 60,
  min_hours_advance: 4,
  min_hours_business_only: false,
  non_business_days: [0, 6],
  max_days_advance: 60,
  no_booking_same_day_after: "",
  block_next_day_dow: null,
  block_next_day_time: "",
};

export const bookingRulesFromJson = (json: Json | null | undefined): BookingRules => {
  const r = (json && typeof json === "object" && !Array.isArray(json) ? json : {}) as Record<string, unknown>;
  const out: BookingRules = { ...DEFAULT_BOOKING_RULES, non_business_days: [...DEFAULT_BOOKING_RULES.non_business_days] };
  if (typeof r.slot_minutes === "number") out.slot_minutes = r.slot_minutes;
  if (typeof r.min_hours_advance === "number") out.min_hours_advance = r.min_hours_advance;
  if (r.min_hours_business_only === true) out.min_hours_business_only = true;
  if (Array.isArray(r.non_business_days)) {
    out.non_business_days = r.non_business_days.filter(
      (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
    );
  }
  if (typeof r.max_days_advance === "number") out.max_days_advance = r.max_days_advance;
  if (typeof r.no_booking_same_day_after === "string") out.no_booking_same_day_after = r.no_booking_same_day_after.slice(0, 5);
  if (r.block_next_day_from && typeof r.block_next_day_from === "object") {
    const b = r.block_next_day_from as Record<string, unknown>;
    if (typeof b.day_of_week === "number") out.block_next_day_dow = b.day_of_week;
    if (typeof b.after_time === "string") out.block_next_day_time = b.after_time.slice(0, 5);
  }
  return out;
};

export const bookingRulesToJson = (r: BookingRules): Json => {
  const out: Record<string, Json> = {
    slot_minutes: r.slot_minutes,
    min_hours_advance: r.min_hours_advance,
    max_days_advance: r.max_days_advance,
  };
  if (r.min_hours_business_only) {
    out.min_hours_business_only = true;
    out.non_business_days = [...new Set(r.non_business_days)].sort((a, b) => a - b);
  }
  if (r.no_booking_same_day_after) out.no_booking_same_day_after = r.no_booking_same_day_after;
  if (r.block_next_day_dow !== null && r.block_next_day_time) {
    out.block_next_day_from = { day_of_week: r.block_next_day_dow, after_time: r.block_next_day_time };
  }
  return out;
};

export const hasAdvancedRules = (r: BookingRules) =>
  r.min_hours_business_only || Boolean(r.no_booking_same_day_after) || r.block_next_day_dow !== null || Boolean(r.block_next_day_time);

export const validateBookingRules = (r: BookingRules): string | null => {
  if (r.min_hours_advance < 0) return "El mínimo de horas de anticipación no puede ser negativo.";
  if (r.max_days_advance < 1) return "El máximo de días debe ser al menos 1.";
  if ((r.block_next_day_dow !== null) !== Boolean(r.block_next_day_time)) {
    return "Para bloquear el día siguiente, completa día y hora (o limpia ambos).";
  }
  if (r.min_hours_business_only && r.non_business_days.length >= 7) return "Deja al menos un día hábil.";
  return null;
};
