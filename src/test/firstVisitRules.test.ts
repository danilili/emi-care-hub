import { describe, expect, it } from "vitest";
import {
  defaultFirstVisitRules,
  depositForPrice,
  rulesFromRow,
  rulesToPatch,
  suggestedMinHours,
  validateFirstVisitRules,
} from "@/lib/firstVisitRules";

const nadia = {
  intake_mode: "form",
  intake_form_url: "https://mamiferanadia.com/formulario.html",
  intake_form_required: false,
  intake_form_deadline_days: 2,
  deposit_mode: "partial",
  deposit_percent: 50,
  deposit_amount: null,
  deposit_deadline_days: 2,
  deposit_applies_to: "first_visit",
  first_visit_min_hours_advance: 48,
};

describe("firstVisitRules", () => {
  it("defaults = comportamiento actual (todo apagado)", () => {
    const d = defaultFirstVisitRules();
    expect(d.intake_mode).toBe("none");
    expect(d.deposit_mode).toBe("none");
    expect(validateFirstVisitRules(d)).toBeNull();
    const patch = rulesToPatch(d);
    expect(patch.intake_form_url).toBeNull();
    expect(patch.deposit_percent).toBeNull();
    expect(patch.deposit_applies_to).toBe("first_visit");
  });

  it("lee la configuración de Nadia y la considera verificada", () => {
    const r = rulesFromRow(nadia);
    expect(r.deposit_kind).toBe("percent");
    expect(r.form_url_verified).toBe(true);
    expect(validateFirstVisitRules(r)).toBeNull();
  });

  it("calcula el anticipo con la misma fórmula que el trigger", () => {
    const r = rulesFromRow(nadia);
    expect(depositForPrice(r, 650)).toBe(325);
    expect(depositForPrice(r, 1150)).toBe(575);
    expect(depositForPrice({ ...r, deposit_mode: "full" }, 900)).toBe(900);
    expect(depositForPrice({ ...r, deposit_kind: "amount", deposit_amount: 200 }, 900)).toBe(200);
    expect(depositForPrice({ ...r, deposit_mode: "none" }, 900)).toBeNull();
  });

  it("sugiere el mayor plazo en horas", () => {
    expect(suggestedMinHours(rulesFromRow(nadia))).toBe(48);
    expect(suggestedMinHours(rulesFromRow({ ...nadia, deposit_deadline_days: 3 }))).toBe(72);
    expect(suggestedMinHours(defaultFirstVisitRules())).toBeNull();
  });

  it("no activa un formulario sin URL verificada", () => {
    const r = { ...defaultFirstVisitRules(), intake_mode: "form" as const, intake_form_url: "https://x.test/f" };
    expect(validateFirstVisitRules(r)).toMatch(/Verifica/);
    expect(validateFirstVisitRules({ ...r, intake_form_url: "notaurl" })).toMatch(/https/);
    expect(validateFirstVisitRules({ ...r, form_url_verified: true })).toBeNull();
  });

  it("rechaza porcentajes y montos inválidos", () => {
    const r = { ...defaultFirstVisitRules(), deposit_mode: "partial" as const };
    expect(validateFirstVisitRules(r)).toMatch(/porcentaje/i);
    expect(validateFirstVisitRules({ ...r, deposit_percent: 150 })).toMatch(/porcentaje/i);
    expect(validateFirstVisitRules({ ...r, deposit_kind: "amount", deposit_amount: 0 })).toMatch(/monto/i);
  });

  it("limpia los campos que no aplican al modo elegido", () => {
    const r = { ...rulesFromRow(nadia), intake_mode: "question" as const, intake_question_text: "¿Motivo?" };
    const p = rulesToPatch(r);
    expect(p.intake_form_url).toBeNull();
    expect(p.intake_form_deadline_days).toBeNull();
    expect(p.intake_question_text).toBe("¿Motivo?");
    expect(p.deposit_percent).toBe(50);
    expect(p.deposit_amount).toBeNull();
  });
});
