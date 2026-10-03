import { describe, expect, it } from "vitest";
import { codificarSessao, decodificarSessao, inicioDoPerfil, perfisPermitidos } from "./sessao-cookie";

describe("cookie de sessão simulada", () => {
  it("ida e volta", () => {
    const sessao = { usuarioId: "P1", perfil: "professora" as const };
    expect(decodificarSessao(codificarSessao(sessao))).toEqual(sessao);
  });

  it.each([undefined, "", "lixo", "admin:X1", "secretaria:", "secretaria:S1:extra"])(
    "rejeita valor inválido %j",
    (valor) => {
      expect(decodificarSessao(valor)).toBeUndefined();
    },
  );

  it("cada perfil tem sua tela inicial", () => {
    expect(inicioDoPerfil("professora")).toBe("/chamada");
    expect(inicioDoPerfil("secretaria")).toBe("/hoje");
    expect(inicioDoPerfil("direcao")).toBe("/hoje");
  });

  it("restringe rotas por perfil, inclusive subrotas", () => {
    expect(perfisPermitidos("/mensalidades")).toEqual(["secretaria", "direcao"]);
    expect(perfisPermitidos("/chamada/T1")).toEqual(["professora"]);
    expect(perfisPermitidos("/chamadax")).toBeUndefined();
    expect(perfisPermitidos("/entrar")).toBeUndefined();
  });
});
