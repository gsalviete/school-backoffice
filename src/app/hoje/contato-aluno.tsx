"use client";

import { useState, useTransition } from "react";
import { contatoResponsavelAction, type RespostaContato } from "./actions";

interface Props {
  alunoId: string;
  nome: string;
  /** Texto extra na linha do aluno (turma, número de faltas). */
  detalhe?: string;
}

// Toque no aluno → busca responsável e telefone no servidor. Nada disso vem junto com a página.
export function ContatoAluno({ alunoId, nome, detalhe }: Props) {
  const [aberto, setAberto] = useState(false);
  const [contato, setContato] = useState<RespostaContato>();
  const [buscando, startTransition] = useTransition();

  function alternar() {
    const abrir = !aberto;
    setAberto(abrir);
    if (!abrir || contato?.ok) return;
    startTransition(async () => {
      try {
        setContato(await contatoResponsavelAction(alunoId));
      } catch {
        setContato({ ok: false });
      }
    });
  }

  return (
    <div className="contato-aluno">
      <button type="button" className="aluno" data-aluno-id={alunoId} aria-expanded={aberto} onClick={alternar}>
        <span>{nome}</span>
        {detalhe && <span className="detalhe">{detalhe}</span>}
      </button>
      {aberto && (
        <div className="contato" role="status" aria-live="polite">
          {buscando || !contato ? (
            "Buscando contato…"
          ) : contato.ok ? (
            <>
              <span>Responsável: {contato.responsavelNome}</span>
              <a href={`tel:${contato.responsavelTelefone.replace(/\D/g, "")}`}>{contato.responsavelTelefone}</a>
            </>
          ) : (
            <span className="msg-erro">Não conseguimos buscar o contato. Tente de novo.</span>
          )}
        </div>
      )}
    </div>
  );
}
