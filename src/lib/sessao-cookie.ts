import type { Perfil } from "@/domain/tipos";

// Sessão SIMULADA da POC: o cookie só diz quem a pessoa escolheu ser em /entrar.
// Não é segurança — qualquer um escolhe qualquer perfil. Auth real vem na fase 2.
// Este módulo é puro (sem acesso a dados) para poder rodar no proxy.

export const COOKIE_SESSAO = "sessao";
/** 400 dias — o máximo que os navegadores aceitam. A professora entra uma vez e fica. */
export const SESSAO_MAX_AGE_S = 400 * 24 * 60 * 60;

export interface Sessao {
  usuarioId: string;
  perfil: Perfil;
}

const PERFIS: readonly Perfil[] = ["professora", "secretaria", "direcao"];

export function codificarSessao(sessao: Sessao): string {
  return `${sessao.perfil}:${sessao.usuarioId}`;
}

export function decodificarSessao(valor: string | undefined): Sessao | undefined {
  if (!valor) return undefined;
  const [perfil, usuarioId, ...resto] = valor.split(":");
  if (resto.length > 0 || !usuarioId || !PERFIS.includes(perfil as Perfil)) return undefined;
  return { perfil: perfil as Perfil, usuarioId };
}

export function inicioDoPerfil(perfil: Perfil): string {
  return perfil === "professora" ? "/chamada" : "/hoje";
}

const ROTAS_RESTRITAS: Record<string, readonly Perfil[]> = {
  "/chamada": ["professora"],
  "/hoje": ["secretaria", "direcao"],
  "/mensalidades": ["secretaria", "direcao"],
};

/** Perfis que podem abrir `caminho`; `undefined` = rota sem restrição de perfil. */
export function perfisPermitidos(caminho: string): readonly Perfil[] | undefined {
  const raiz = Object.keys(ROTAS_RESTRITAS).find((r) => caminho === r || caminho.startsWith(`${r}/`));
  return raiz ? ROTAS_RESTRITAS[raiz] : undefined;
}
