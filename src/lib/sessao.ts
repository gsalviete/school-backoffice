import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { repos } from "@/data";
import type { Perfil, Usuario } from "@/domain/tipos";
import { COOKIE_SESSAO, decodificarSessao, inicioDoPerfil } from "./sessao-cookie";

/** Usuária da sessão atual, conferida contra os dados (o proxy só faz a checagem otimista). */
export async function usuarioDaSessao(): Promise<Usuario | undefined> {
  const sessao = decodificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!sessao) return undefined;
  const usuario = await repos().usuarios.buscar(sessao.usuarioId);
  return usuario?.perfil === sessao.perfil ? usuario : undefined;
}

/** Para páginas e server actions: sem sessão → /entrar; perfil errado → tela inicial do perfil. */
export async function exigirPerfil(...perfis: Perfil[]): Promise<Usuario> {
  const usuario = await usuarioDaSessao();
  if (!usuario) redirect("/entrar");
  if (!perfis.includes(usuario.perfil)) redirect(inicioDoPerfil(usuario.perfil));
  return usuario;
}
