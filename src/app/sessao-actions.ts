"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { repos } from "@/data";
import { log } from "@/lib/log";
import { usuarioDaSessao } from "@/lib/sessao";
import { COOKIE_SESSAO, SESSAO_MAX_AGE_S, codificarSessao, inicioDoPerfil } from "@/lib/sessao-cookie";

export async function entrar(formData: FormData) {
  const usuario = await repos().usuarios.buscar(String(formData.get("usuarioId")));
  if (!usuario) redirect("/entrar");

  (await cookies()).set(COOKIE_SESSAO, codificarSessao({ usuarioId: usuario.id, perfil: usuario.perfil }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSAO_MAX_AGE_S,
  });
  log.info({ evento: "session_started", perfil: usuario.perfil, usuarioId: usuario.id }, "session_started");
  redirect(inicioDoPerfil(usuario.perfil));
}

export async function sair() {
  const usuario = await usuarioDaSessao();
  (await cookies()).delete(COOKIE_SESSAO);
  if (usuario) {
    log.info({ evento: "session_ended", perfil: usuario.perfil, usuarioId: usuario.id }, "session_ended");
  }
  redirect("/entrar");
}
