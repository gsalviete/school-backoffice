import { describe, expect, it } from "vitest";
import { criarReposEmMemoria } from "./index";
import { criarSeed } from "./seed";

const HOJE = "2026-10-20";

function repos() {
  return criarReposEmMemoria(criarSeed(HOJE));
}

describe("repositório em memória", () => {
  it("lista só as turmas da professora", async () => {
    const r = repos();
    const professoraComDuas = (await r.usuarios.listar()).find((u) => u.id === "P1");
    expect(professoraComDuas?.perfil).toBe("professora");

    const ids = (await r.turmas.listarPorProfessora("P1")).map((t) => t.id);
    expect(ids).toEqual(["T1", "T2"]);
  });

  it("lista só alunos ativos da turma", async () => {
    const r = repos();
    const todos = (await r.alunos.listar()).filter((a) => a.turmaId === "T1");
    expect(todos.filter((a) => !a.ativo)).toHaveLength(1);

    const lista = await r.alunos.listarAtivosPorTurma("T1");
    expect(lista).toHaveLength(20);
    expect(lista.every((a) => a.ativo)).toBe(true);
  });

  it("seed tem a escala do produto", async () => {
    const r = repos();
    const turmas = await r.turmas.listar();
    const alunos = await r.alunos.listar();
    const usuarios = await r.usuarios.listar();
    const professoras = usuarios.filter((u) => u.perfil === "professora");

    expect(turmas).toHaveLength(10);
    expect(alunos.length).toBeGreaterThanOrEqual(150);
    expect(alunos.length).toBeLessThanOrEqual(200);

    const turmasPorProfessora = professoras.map((p) => turmas.filter((t) => t.professoraId === p.id).length);
    expect(turmasPorProfessora.some((n) => n >= 2)).toBe(true);

    expect(usuarios.filter((u) => u.perfil === "secretaria")).toHaveLength(1);
    expect(usuarios.filter((u) => u.perfil === "direcao")).toHaveLength(1);
  });

  it("seed é determinístico para a mesma data", () => {
    expect(criarSeed(HOJE)).toEqual(criarSeed(HOJE));
  });

  it("seed traz alunos com exatamente 4 e 5 faltas no mês corrente", async () => {
    const r = repos();
    const chamadas = await r.chamadas.listarPorPeriodo("2026-10-01", HOJE);
    const faltasPorAluno = new Map<string, number>();
    for (const c of chamadas) {
      for (const id of c.faltasAlunoIds) faltasPorAluno.set(id, (faltasPorAluno.get(id) ?? 0) + 1);
    }
    const contagens = [...faltasPorAluno.values()];
    expect(contagens).toContain(4);
    expect(contagens).toContain(5);
  });

  it("seed traz mensalidades pagas e em aberto até o mês atual, nunca depois", async () => {
    const r = repos();
    const mensalidades = await r.mensalidades.listar();
    expect(mensalidades.some((m) => m.pagaEm)).toBe(true);
    expect(mensalidades.some((m) => !m.pagaEm)).toBe(true);
    expect(mensalidades.every((m) => m.competencia <= "2026-10")).toBe(true);
  });

  it("dados pessoais do seed são fictícios", async () => {
    const alunos = await repos().alunos.listar();
    expect(alunos.every((a) => /^\(11\) 90000-0\d{3}$/.test(a.responsavelTelefone))).toBe(true);
  });
});
