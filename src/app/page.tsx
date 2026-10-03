import { redirect } from "next/navigation";
import { usuarioDaSessao } from "@/lib/sessao";
import { inicioDoPerfil } from "@/lib/sessao-cookie";

// O proxy já redireciona "/"; isto cobre o caso de cookie válido no formato mas com usuária inexistente.
export default async function Inicio() {
  const usuario = await usuarioDaSessao();
  redirect(usuario ? inicioDoPerfil(usuario.perfil) : "/entrar");
}
