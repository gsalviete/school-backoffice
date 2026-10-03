import type { Usuario } from "@/domain/tipos";
import { sair } from "./sessao-actions";

export function Cabecalho({ usuario }: { usuario: Usuario }) {
  return (
    <header className="cabecalho">
      <strong>{usuario.nome}</strong>
      <form action={sair}>
        <button type="submit" className="secundario">
          Sair
        </button>
      </form>
    </header>
  );
}
