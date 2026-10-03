import { describe, expect, it } from "vitest";
import { criarReposEmMemoria } from "@/data/memory";
import { criarSeed } from "@/data/memory/seed";
import type { Usuario } from "@/domain/tipos";
import { desfazerPagamento, listarEmAberto, listarPagasRecentes, marcarComoPaga } from "./mensalidades";

const HOJE = "2026-10-15";
const SECRETARIA: Usuario = { id: "S1", nome: "Secretaria", perfil: "secretaria" };
const DIRECAO: Usuario = { id: "D1", nome: "Direção", perfil: "direcao" };
const PROFESSORA: Usuario = { id: "P1", nome: "Professora Ana", perfil: "professora" };

async function cenario() {
  const repos = criarReposEmMemoria(criarSeed(HOJE));
  const [m] = await listarEmAberto(repos, HOJE);
  return { repos, m: m! };
}

const ids = (lista: { id: string }[]) => lista.map((x) => x.id);

describe("pagamento", () => {
  it("marcar como paga registra a data informada e sai da lista", async () => {
    const { repos, m } = await cenario();
    const r = await marcarComoPaga(repos, { id: m.id, data: "2026-10-14", hoje: HOJE, usuario: SECRETARIA });

    expect(r).toMatchObject({ ok: true, mensalidade: { id: m.id, pagaEm: "2026-10-14" } });
    expect((await repos.mensalidades.listar()).find((x) => x.id === m.id)?.pagaEm).toBe("2026-10-14");
    expect(ids(await listarEmAberto(repos, HOJE))).not.toContain(m.id);
    expect(ids(await listarPagasRecentes(repos, HOJE))).toContain(m.id);
  });

  it("desfazer volta para em aberto", async () => {
    const { repos, m } = await cenario();
    await marcarComoPaga(repos, { id: m.id, data: "2026-10-14", hoje: HOJE, usuario: DIRECAO });
    const r = await desfazerPagamento(repos, { id: m.id, usuario: DIRECAO });

    expect(r).toMatchObject({ ok: true });
    expect((await repos.mensalidades.listar()).find((x) => x.id === m.id)?.pagaEm).toBeUndefined();
    expect(ids(await listarEmAberto(repos, HOJE))).toContain(m.id);
    expect(ids(await listarPagasRecentes(repos, HOJE))).not.toContain(m.id);
  });

  it("data de pagamento no futuro é rejeitada sem alterar nada", async () => {
    const { repos, m } = await cenario();
    const r = await marcarComoPaga(repos, { id: m.id, data: "2026-10-16", hoje: HOJE, usuario: SECRETARIA });
    expect(r).toEqual({ ok: false, motivo: "data-futura" });
    expect(ids(await listarEmAberto(repos, HOJE))).toContain(m.id);
  });

  it("professora não marca nem desfaz pagamento", async () => {
    const { repos, m } = await cenario();
    expect(await marcarComoPaga(repos, { id: m.id, data: HOJE, hoje: HOJE, usuario: PROFESSORA })).toEqual({
      ok: false,
      motivo: "sem-permissao",
    });
    expect(ids(await listarEmAberto(repos, HOJE))).toContain(m.id);

    await marcarComoPaga(repos, { id: m.id, data: HOJE, hoje: HOJE, usuario: SECRETARIA });
    expect(await desfazerPagamento(repos, { id: m.id, usuario: PROFESSORA })).toEqual({ ok: false, motivo: "sem-permissao" });
    expect(ids(await listarEmAberto(repos, HOJE))).not.toContain(m.id);
  });

  it("mensalidade inexistente", async () => {
    const { repos } = await cenario();
    expect(await marcarComoPaga(repos, { id: "nao-existe", data: HOJE, hoje: HOJE, usuario: SECRETARIA })).toEqual({
      ok: false,
      motivo: "nao-encontrada",
    });
  });
});

describe("lista em aberto", () => {
  it("atrasadas primeiro, com aluno e turma", async () => {
    // 07/10: setembro já venceu, outubro ainda não (vence dia 10) — as duas situações na lista.
    const repos = criarReposEmMemoria(criarSeed("2026-10-07"));
    const lista = await listarEmAberto(repos, "2026-10-07");
    const atrasada = lista.map((m) => m.situacao.tipo === "atrasada");
    expect(atrasada).toContain(true);
    expect(atrasada).toContain(false);
    expect(atrasada).toEqual([...atrasada].sort((a, b) => Number(b) - Number(a)));
    expect(lista[0]!.alunoNome).not.toBe("");
    expect(lista[0]!.turmaNome).not.toBe("");
  });

  it("gera sob demanda a mensalidade do mês que virou", async () => {
    const repos = criarReposEmMemoria(criarSeed("2026-10-31"));
    const lista = await listarEmAberto(repos, "2026-11-02");
    expect(lista.some((m) => m.competencia === "2026-11")).toBe(true);
    // Aluno desativado (último de T1) não ganha novembro.
    expect(lista.some((m) => m.alunoId === "T1-21" && m.competencia === "2026-11")).toBe(false);
  });
});
