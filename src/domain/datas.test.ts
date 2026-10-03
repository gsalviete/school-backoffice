import { describe, expect, it } from "vitest";
import { diaUtilVizinho, diasUteisDoPeriodo, hojeEmSaoPaulo, somarDias } from "./datas";

describe("datas no fuso da escola", () => {
  it("22h em São Paulo ainda é o mesmo dia (UTC já virou)", () => {
    // 2026-10-06T01:00Z = 2026-10-05 22:00 em São Paulo
    expect(hojeEmSaoPaulo(new Date("2026-10-06T01:00:00Z"))).toBe("2026-10-05");
  });

  it("soma dias atravessando o mês", () => {
    expect(somarDias("2026-09-29", 3)).toBe("2026-10-02");
    expect(somarDias("2026-10-02", -2)).toBe("2026-09-30");
  });

  it("dias úteis ignoram sábado e domingo", () => {
    // 2026-10-02 é sexta; 03 e 04 fim de semana
    expect(diasUteisDoPeriodo("2026-10-01", "2026-10-06")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
    ]);
  });
});

describe("dia útil vizinho", () => {
  it("pula o fim de semana nos dois sentidos", () => {
    expect(diaUtilVizinho("2026-10-05", -1)).toBe("2026-10-02"); // segunda → sexta
    expect(diaUtilVizinho("2026-10-02", 1)).toBe("2026-10-05"); // sexta → segunda
    expect(diaUtilVizinho("2026-10-07", -1)).toBe("2026-10-06");
  });
});
