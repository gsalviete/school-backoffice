import type { Repos } from "@/data/repos";
import * as regras from "@/domain/mensalidades";
import type { DataCivil, Mensalidade, Perfil, Usuario } from "@/domain/tipos";

// Fluxo de mensalidades sobre os repositórios. Regras em src/domain/mensalidades.ts.

const PODEM_REGISTRAR: readonly Perfil[] = ["secretaria", "direcao"];
const PAGAS_RECENTES = 20;

export interface MensalidadeNaLista extends Mensalidade {
  alunoNome: string;
  turmaNome: string;
  situacao: regras.Situacao;
}

/** POC: gera sob demanda, a cada consulta, as mensalidades que faltam até o mês de `hoje`. */
async function garantir(repos: Repos, hoje: DataCivil): Promise<Mensalidade[]> {
  const [alunos, existentes] = await Promise.all([repos.alunos.listar(), repos.mensalidades.listar()]);
  const todas = regras.garantirMensalidades(alunos, existentes, hoje.slice(0, 7));
  // garantirMensalidades devolve as existentes primeiro; o que vem depois é novo.
  for (const nova of todas.slice(existentes.length)) await repos.mensalidades.salvar(nova);
  return todas;
}

async function comAluno(repos: Repos, lista: Mensalidade[], hoje: DataCivil): Promise<MensalidadeNaLista[]> {
  const [alunos, turmas] = await Promise.all([repos.alunos.listar(), repos.turmas.listar()]);
  const alunoPorId = new Map(alunos.map((a) => [a.id, a]));
  const turmaPorId = new Map(turmas.map((t) => [t.id, t]));
  return lista.map((m) => {
    const aluno = alunoPorId.get(m.alunoId);
    return {
      ...m,
      alunoNome: aluno?.nome ?? "",
      turmaNome: (aluno && turmaPorId.get(aluno.turmaId)?.nome) ?? "",
      situacao: regras.situacao(m, hoje),
    };
  });
}

/** Em aberto, atrasadas primeiro. */
export async function listarEmAberto(repos: Repos, hoje: DataCivil): Promise<MensalidadeNaLista[]> {
  return comAluno(repos, regras.ordenarEmAberto(await garantir(repos, hoje), hoje), hoje);
}

/** Últimos pagamentos registrados no app (os do seed não entram), para poder desfazer. */
export async function listarPagasRecentes(repos: Repos, hoje: DataCivil): Promise<MensalidadeNaLista[]> {
  const pagas = (await repos.mensalidades.listar())
    .filter((m) => m.pagaEm && m.pagamentoRegistradoEm)
    .sort((a, b) => b.pagamentoRegistradoEm!.localeCompare(a.pagamentoRegistradoEm!))
    .slice(0, PAGAS_RECENTES);
  return comAluno(repos, pagas, hoje);
}

export type ResultadoPagamento =
  | { ok: true; mensalidade: Mensalidade }
  | { ok: false; motivo: "sem-permissao" | "nao-encontrada" | "data-invalida" | "data-futura" };

interface EntradaMarcar {
  id: string;
  data: string;
  hoje: DataCivil;
  usuario: Usuario;
}

export async function marcarComoPaga(
  repos: Repos,
  { id, data, hoje, usuario }: EntradaMarcar,
  agora: Date = new Date(),
): Promise<ResultadoPagamento> {
  if (!PODEM_REGISTRAR.includes(usuario.perfil)) return { ok: false, motivo: "sem-permissao" };
  const m = await repos.mensalidades.buscar(id);
  if (!m) return { ok: false, motivo: "nao-encontrada" };
  const r = regras.marcarComoPaga(m, data, hoje);
  if (!r.ok) return r;
  const mensalidade = { ...r.mensalidade, pagamentoRegistradoEm: agora.toISOString() };
  await repos.mensalidades.salvar(mensalidade);
  return { ok: true, mensalidade };
}

export async function desfazerPagamento(
  repos: Repos,
  { id, usuario }: { id: string; usuario: Usuario },
): Promise<ResultadoPagamento> {
  if (!PODEM_REGISTRAR.includes(usuario.perfil)) return { ok: false, motivo: "sem-permissao" };
  const m = await repos.mensalidades.buscar(id);
  if (!m) return { ok: false, motivo: "nao-encontrada" };
  const mensalidade = regras.desfazerPagamento(m);
  await repos.mensalidades.salvar(mensalidade);
  return { ok: true, mensalidade };
}
