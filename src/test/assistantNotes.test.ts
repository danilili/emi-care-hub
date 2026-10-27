import { describe, expect, it } from "vitest";
import { validateAssistantNotes } from "@/lib/assistantNotes";

const nadia = { first_name: "Nadia", last_name: "Ávila Salazar", alias: "Nadia" };

describe("validateAssistantNotes", () => {
  it("acepta contexto sin instrucciones ni nombres", () => {
    expect(
      validateAssistantNotes(
        "Toda pregunta es bienvenida, aunque parezca pequeña. Es importante leer al cuerpo.",
        nadia,
      ),
    ).toBeNull();
    expect(validateAssistantNotes("", nadia)).toBeNull();
  });

  it("rechaza la nota original de Nadia (canaliza con + nombre)", () => {
    expect(
      validateAssistantNotes("las dudas de las consultantes registradas se canalizan con Nadia directamente.", nadia),
    ).toMatch(/canaliza con/);
  });

  it("rechaza 'le aviso a' y 'avísale a'", () => {
    expect(validateAssistantNotes("si hay dudas le aviso a la terapeuta", nadia)).toMatch(/le aviso a/);
    expect(validateAssistantNotes("avísale a la doctora", nadia)).toMatch(/avísale a/);
  });

  it("rechaza el nombre, apellido o alias del terapeuta y el nombre Emi", () => {
    expect(validateAssistantNotes("Pregúntale a Nadia", nadia)).toMatch(/Nadia/);
    expect(validateAssistantNotes("la consulta la da Salazar", nadia)).toMatch(/Salazar/);
    expect(validateAssistantNotes("Emi responde amable", nadia)).toMatch(/Emi/);
  });

  it("no confunde palabras que contienen el nombre", () => {
    expect(validateAssistantNotes("Trabajo con reyes y emisiones", { first_name: "Rey", alias: "Emi" })).toBeNull();
  });
});
