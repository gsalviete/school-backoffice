import { repos } from "@/data";
import { mesAno, moeda, textoSituacao } from "@/lib/formato";
import { hoje } from "@/lib/relogio";
import { exigirPerfil } from "@/lib/sessao";
import { listarEmAberto, listarPagasRecentes, type MensalidadeNaLista } from "@/servicos/mensalidades";
import { Cabecalho } from "../cabecalho";
import { ListaMensalidades, type Linha } from "./lista-mensalidades";

function linha(m: MensalidadeNaLista): Linha {
  return {
    id: m.id,
    alunoNome: m.alunoNome,
    turmaNome: m.turmaNome,
    mes: mesAno(m.competencia),
    valor: moeda(m.valorCentavos),
    situacao: m.situacao.tipo === "paga" ? `Paga em ${m.pagaEm!.split("-").reverse().join("/")}` : textoSituacao(m.situacao),
    atrasada: m.situacao.tipo === "atrasada",
  };
}

export default async function MensalidadesPage() {
  const usuario = await exigirPerfil("secretaria", "direcao");
  const dia = hoje();
  const [emAberto, pagas] = await Promise.all([listarEmAberto(repos(), dia), listarPagasRecentes(repos(), dia)]);

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="largo">
        <h1>Mensalidades</h1>
        <ListaMensalidades hoje={dia} emAberto={emAberto.map(linha)} pagas={pagas.map(linha)} />
      </main>
    </>
  );
}
