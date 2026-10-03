import { repos } from "@/data";
import type { Usuario } from "@/domain/tipos";
import { entrar } from "../sessao-actions";

function Botoes({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <ul className="lista-botoes">
      {usuarios.map((u) => (
        <li key={u.id}>
          <form action={entrar}>
            <input type="hidden" name="usuarioId" value={u.id} />
            <button type="submit">{u.nome}</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function EntrarPage() {
  const usuarios = await repos().usuarios.listar();
  return (
    <main>
      <h1>Quem é você?</h1>
      <p>Toque no seu nome para entrar. O celular vai lembrar de você.</p>
      <h2>Professoras</h2>
      <Botoes usuarios={usuarios.filter((u) => u.perfil === "professora")} />
      <h2>Secretaria e direção</h2>
      <Botoes usuarios={usuarios.filter((u) => u.perfil !== "professora")} />
    </main>
  );
}
