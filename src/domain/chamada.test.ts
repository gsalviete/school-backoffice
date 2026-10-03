import { describe, expect, it } from "vitest";
import { inicioDaSemana, podeProfessoraEditar, statusDoDia } from "./chamada";

describe("regra de correção da chamada", () => {
  it("professora corrige chamada da mesma semana", () => {
    // segunda 2026-10-05, hoje quarta 2026-10-07
    expect(podeProfessoraEditar("2026-10-05", "2026-10-07")).toBe(true);
  });

  it("professora não corrige chamada da semana anterior", () => {
    // sexta 2026-10-02, hoje segunda 2026-10-05
    expect(podeProfessoraEditar("2026-10-02", "2026-10-05")).toBe(false);
  });

  it("domingo ainda é a mesma semana da segunda anterior", () => {
    expect(podeProfessoraEditar("2026-10-05", "2026-10-11")).toBe(true);
  });

  it("não edita dia futuro", () => {
    expect(podeProfessoraEditar("2026-10-08", "2026-10-07")).toBe(false);
  });

  it("semana começa na segunda", () => {
    expect(inicioDaSemana("2026-10-07")).toBe("2026-10-05");
    expect(inicioDaSemana("2026-10-05")).toBe("2026-10-05");
    expect(inicioDaSemana("2026-10-04")).toBe("2026-09-28"); // domingo
  });
});

describe("status do dia", () => {
  it("feita quando existe chamada da turma na data", () => {
    const chamadas = [{ turmaId: "T1", data: "2026-10-07" }];
    expect(statusDoDia("T1", "2026-10-07", chamadas)).toBe("feita");
    expect(statusDoDia("T2", "2026-10-07", chamadas)).toBe("pendente");
    expect(statusDoDia("T1", "2026-10-08", chamadas)).toBe("pendente");
  });
});
