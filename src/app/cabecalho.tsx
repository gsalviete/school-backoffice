import Link from "next/link";
import type { Usuario } from "@/domain/tipos";
import { sair } from "./sessao-actions";

export function Cabecalho({ usuario }: { usuario: Usuario }) {
  return (
    <header className="cabecalho">
      <strong>{usuario.nome}</strong>
      {/* Menu só para secretaria/direção — o acesso de verdade é conferido no servidor. */}
      {usuario.perfil !== "professora" && (
        <nav className="menu" aria-label="Menu">
          <Link href="/hoje">Hoje</Link>
          <Link href="/mensalidades">Mensalidades</Link>
        </nav>
      )}
      <form action={sair}>
        <button type="submit" className="secundario">
          Sair
        </button>
      </form>
    </header>
  );
}
