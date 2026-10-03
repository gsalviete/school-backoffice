"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { salvarChamadaAction } from "../actions";

interface Props {
  turmaId: string;
  data: string;
  alunos: { id: string; nome: string }[];
  faltasIniciais: string[];
  editavel: boolean;
}

type Aviso = { tipo: "ok" | "erro"; texto: string } | undefined;

const SEM_CONEXAO = "Não conseguimos salvar. Verifique a internet e tente de novo.";

export function ListaChamada({ turmaId, data, alunos, faltasIniciais, editavel }: Props) {
  const router = useRouter();
  // As marcações ficam aqui até o servidor confirmar — uma falha de rede não apaga nada.
  const [faltas, setFaltas] = useState(() => new Set(faltasIniciais));
  const [aviso, setAviso] = useState<Aviso>();
  const [falhou, setFalhou] = useState(false);
  const [salvando, startTransition] = useTransition();

  function alternar(id: string) {
    setAviso(undefined);
    setFaltas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  function salvar() {
    startTransition(async () => {
      try {
        const r = await salvarChamadaAction(turmaId, data, [...faltas]);
        if (r.ok) {
          setFalhou(false);
          setAviso({ tipo: "ok", texto: "Chamada salva" });
          router.refresh();
        } else {
          setAviso({ tipo: "erro", texto: r.mensagem });
        }
      } catch {
        setFalhou(true);
        setAviso({ tipo: "erro", texto: SEM_CONEXAO });
      }
    });
  }

  return (
    <>
      {!editavel && <p className="aviso">Só a secretaria pode alterar esta chamada.</p>}
      <ul className="lista-alunos">
        {alunos.map((a) => {
          const faltou = faltas.has(a.id);
          return (
            <li key={a.id}>
              <button
                type="button"
                className={faltou ? "aluno faltou" : "aluno"}
                data-aluno-id={a.id}
                aria-pressed={faltou}
                disabled={!editavel || salvando}
                onClick={() => alternar(a.id)}
              >
                <span>{a.nome}</span>
                <span className="marca">{faltou ? "Faltou" : "Presente"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {editavel && (
        <div className="barra-fixa">
          <div role="status" aria-live="polite" className={aviso?.tipo === "erro" ? "msg-erro" : "msg-ok"}>
            {aviso ? aviso.texto : faltas.size === 1 ? "1 falta" : `${faltas.size} faltas`}
          </div>
          <button type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : falhou ? "Tentar de novo" : "Salvar"}
          </button>
        </div>
      )}
    </>
  );
}
