"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { desfazerPagamentoAction, marcarPagaAction, type RespostaPagamento } from "./actions";

/** Linha já formatada no servidor. */
export interface Linha {
  id: string;
  alunoNome: string;
  turmaNome: string;
  mes: string;
  valor: string;
  situacao: string;
  atrasada: boolean;
}

interface Props {
  hoje: string;
  emAberto: Linha[];
  pagas: Linha[];
}

type Aviso = { tipo: "ok" | "erro"; texto: string; desfazerId?: string } | undefined;

const SEM_CONEXAO = "Não conseguimos salvar. Verifique a internet e tente de novo.";
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function Dados({ linha: l, classeSituacao }: { linha: Linha; classeSituacao: string }) {
  return (
    <div className="dados">
      <strong>{l.alunoNome}</strong>
      <span className="detalhe">
        {l.turmaNome} · {l.mes} · {l.valor}
      </span>
      <span className={classeSituacao}>{l.situacao}</span>
    </div>
  );
}

export function ListaMensalidades({ hoje, emAberto, pagas }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [abertaId, setAbertaId] = useState<string>();
  const [data, setData] = useState(hoje);
  const [aviso, setAviso] = useState<Aviso>();
  const [salvando, startTransition] = useTransition();

  function executar(acao: () => Promise<RespostaPagamento>, sucesso: Aviso) {
    startTransition(async () => {
      try {
        const r = await acao();
        setAviso(r.ok ? sucesso : { tipo: "erro", texto: r.mensagem });
        if (r.ok) {
          setAbertaId(undefined);
          router.refresh();
        }
      } catch {
        setAviso({ tipo: "erro", texto: SEM_CONEXAO });
      }
    });
  }

  const confirmar = (id: string) =>
    executar(() => marcarPagaAction(id, data), { tipo: "ok", texto: "Pagamento registrado", desfazerId: id });
  const desfazer = (id: string) =>
    executar(() => desfazerPagamentoAction(id), { tipo: "ok", texto: "Pagamento desfeito" });

  function abrir(id: string) {
    setAbertaId(abertaId === id ? undefined : id);
    setData(hoje);
  }

  const termo = normalizar(busca.trim());
  const visiveis = termo ? emAberto.filter((l) => normalizar(l.alunoNome).includes(termo)) : emAberto;

  return (
    <>
      <label className="campo">
        <span>Buscar aluno</span>
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do aluno" />
      </label>

      {aviso && (
        <div role="status" aria-live="polite" className={`contato ${aviso.tipo === "erro" ? "msg-erro" : "msg-ok"}`}>
          <span>{aviso.texto}</span>
          {aviso.desfazerId && (
            <button type="button" className="secundario" disabled={salvando} onClick={() => desfazer(aviso.desfazerId!)}>
              Desfazer
            </button>
          )}
        </div>
      )}

      <h2>Em aberto ({visiveis.length})</h2>
      {visiveis.length === 0 ? (
        <p>{termo ? "Nenhuma mensalidade em aberto para esse nome." : "Nenhuma mensalidade em aberto."}</p>
      ) : (
        <ul className="lista-alunos" data-lista="em-aberto">
          {visiveis.map((l) => (
            <li key={l.id} data-mensalidade-id={l.id} className={l.atrasada ? "mensalidade atrasada" : "mensalidade"}>
              <Dados linha={l} classeSituacao={l.atrasada ? "msg-erro" : "status-pendente"} />
              {abertaId === l.id ? (
                <div className="painel-pagamento">
                  <label className="campo">
                    <span>Data do pagamento</span>
                    <input type="date" value={data} max={hoje} required onChange={(e) => setData(e.target.value)} />
                  </label>
                  <button type="button" disabled={salvando || !data} onClick={() => confirmar(l.id)}>
                    {salvando ? "Salvando…" : "Confirmar"}
                  </button>
                  <button type="button" className="secundario" disabled={salvando} onClick={() => setAbertaId(undefined)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button type="button" className="secundario" disabled={salvando} onClick={() => abrir(l.id)}>
                  Marcar como paga
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <details className="pagas-recentes">
        <summary>Pagas recentemente ({pagas.length})</summary>
        {pagas.length === 0 ? (
          <p>Nenhum pagamento registrado ainda.</p>
        ) : (
          <ul className="lista-alunos" data-lista="pagas">
            {pagas.map((l) => (
              <li key={l.id} data-mensalidade-id={l.id} className="mensalidade">
                <Dados linha={l} classeSituacao="status-feita" />
                <button type="button" className="secundario" disabled={salvando} onClick={() => desfazer(l.id)}>
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </>
  );
}
