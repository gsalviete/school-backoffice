import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, decodificarSessao, inicioDoPerfil, perfisPermitidos } from "@/lib/sessao-cookie";

// Checagem otimista por cookie: só redireciona. A verificação de verdade é `exigirPerfil` nas páginas.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessao = decodificarSessao(request.cookies.get(COOKIE_SESSAO)?.value);
  const ir = (caminho: string) => NextResponse.redirect(new URL(caminho, request.url));

  if (pathname === "/entrar") return sessao ? ir(inicioDoPerfil(sessao.perfil)) : NextResponse.next();
  if (!sessao) return ir("/entrar");
  if (pathname === "/") return ir(inicioDoPerfil(sessao.perfil));

  const permitidos = perfisPermitidos(pathname);
  if (permitidos && !permitidos.includes(sessao.perfil)) return ir(inicioDoPerfil(sessao.perfil));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|manifest.webmanifest|icon.svg|favicon.ico).*)"],
};
