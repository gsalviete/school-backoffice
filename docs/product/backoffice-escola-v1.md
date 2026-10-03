# Backoffice da escola — v1: Chamada e Mensalidades

## Problem

Uma escola pequena (~10 professoras, 1 secretária, ~200 alunos em ~10 turmas) controla tudo em papel. A chamada e o controle de mensalidades tomam tempo e não dão uma visão geral: é difícil saber rapidamente quem faltou hoje, quem está faltando demais e quem está com a mensalidade em atraso.

A equipe tem 40+ anos e pouca familiaridade com sistemas, mas já começou a usar IA generativa para escrever avisos há ~3 meses — há abertura para ferramentas digitais, desde que sejam muito simples.

## Who it's for

- **Professora** (~10): faz a chamada diária das próprias turmas (uma professora pode ter várias) pelo próprio celular, dentro da sala. Não vê nada financeiro.
- **Secretária** (1): cadastra alunos, turmas e professoras; registra pagamentos; acompanha faltas e atrasos. Usa principalmente o computador da escola.
- **Direção**: mesmas visões da secretária (frequência e financeiro).
- Pais/responsáveis **não** acessam o sistema na v1.

Prioridade máxima para todos: facilidade de uso — poucos toques, letras e botões grandes, linguagem do dia a dia (sem jargão técnico).

## Success criteria

Medidos após 1 mês de uso:

- ≥ 90% dos dias letivos com chamada registrada no sistema, em todas as turmas.
- A secretária consegue responder "quem está com mensalidade atrasada?" em menos de 1 minuto.
- A folha de chamada em papel e o controle de pagamentos em papel deixam de ser usados.

## Scope

### In

**Acesso**
- Login com usuário e senha feito uma vez; o celular/computador permanece conectado.
- Pode ser adicionado à tela inicial do celular como um app.
- Três perfis: professora, secretária, direção.

**Cadastro (secretária)**
- Importação inicial por planilha simples: nome do aluno, turma, nome do responsável, telefone do responsável.
- Cadastro, edição e desativação de alunos, turmas e professoras um a um durante o ano.
- Vínculo professora ↔ turma: **uma professora pode ter várias turmas**.
- Dados guardados por aluno: apenas nome, turma, nome do responsável e telefone do responsável.

**Chamada (professora)**
- Uma chamada por dia por turma.
- Professora com várias turmas escolhe a turma num toque antes de fazer a chamada; com uma turma só, vai direto para a chamada.
- Lista da turma já vem com todos "presentes"; a professora toca só em quem faltou e salva.
- Dois estados apenas: presente / faltou.
- A professora pode corrigir chamadas da semana corrente; dias de semanas anteriores só a secretária altera.

**Visão de frequência (secretária e direção)**
- Tela "Hoje": quem faltou em cada turma e quais turmas ainda não fizeram a chamada.
- Lista de alunos com **5 ou mais faltas no mês**.

**Mensalidades (só secretária e direção)**
- Valor de mensalidade único para todos os alunos; sem descontos, bolsas ou isenções.
- Cada aluno ativo tem uma mensalidade por mês, com vencimento em dia fixo.
- **Todos os 12 meses do ano (janeiro a dezembro) geram mensalidade**, inclusive férias. Decisão válida por enquanto; pode mudar no futuro.
- Registrar pagamento: marcar o mês como "pago" com data (padrão: hoje, editável).
- Lista de mensalidades em aberto/atrasadas, mostrando "em atraso há X dias".

### Out

- Gateway de pagamento, boleto, Pix integrado ou qualquer cobrança automática.
- Cálculo de multa ou juros (se a escola cobrar, isso fica fora do sistema).
- Pagamento parcial e forma de pagamento.
- Descontos, bolsas, isenções, valores diferentes por aluno ou turma.
- Falta justificada, atraso, atestado.
- Chamada por aula/disciplina.
- Funcionamento sem internet (offline).
- Acesso de pais/responsáveis.
- Dados além do mínimo (CPF, endereço, data de nascimento, saúde, foto).
- Notas, recados, controle de estoque e material (frentes futuras).
- IA para gerar provas no formato da escola e imagens de comunicado (ideias futuras).

## Acceptance criteria

**Acesso**
- Dado uma professora que já entrou no sistema no celular, quando ela abre de novo no dia seguinte, então entra sem pedir senha e cai direto na chamada (se tiver uma turma) ou na escolha das suas turmas (se tiver várias).
- Dado uma professora logada, quando ela navega pelo sistema, então não vê nenhuma informação de mensalidade.

**Cadastro**
- Dado uma planilha com nome, turma, responsável e telefone, quando a secretária importa, então os alunos aparecem nas turmas certas e as linhas com problema são mostradas em linguagem simples sem bloquear as demais.
- Dado um aluno desativado, então ele não aparece na chamada nem gera novas mensalidades.

**Chamada**
- Dado uma professora na tela de chamada do dia, quando ela não toca em ninguém e salva, então todos ficam como presentes.
- Dado uma turma de 20 alunos com 2 faltas, então a chamada é concluída com no máximo 4 toques (abrir, 2 faltas, salvar).
- Dado uma professora com 2 turmas, quando ela abre a chamada, então vê apenas as suas 2 turmas, cada uma indicando se a chamada de hoje já foi feita.
- Dado uma chamada feita na segunda-feira, quando a professora a corrige na quarta da mesma semana, então a correção é aceita.
- Dado uma chamada da semana anterior, quando a professora tenta corrigir, então o sistema informa que só a secretária pode alterar.
- Dado uma falha de conexão ao salvar, então a professora vê um aviso claro e pode tentar de novo sem perder o que marcou.

**Visão de frequência**
- Dado que 3 turmas fizeram chamada e 7 não, quando a secretária abre "Hoje", então vê as faltas das 3 turmas e a lista das 7 pendentes.
- Dado um aluno com 5 faltas no mês corrente, então ele aparece na lista de muitas faltas; com 4, não aparece.

**Mensalidades**
- Dado um aluno ativo, quando começa um novo mês, então existe uma mensalidade em aberto para ele com o valor único da escola — em qualquer um dos 12 meses, inclusive janeiro, julho e dezembro.
- Dado uma mensalidade em aberto após o vencimento, então ela aparece como atrasada com o número de dias de atraso.
- Dado uma mensalidade em aberto, quando a secretária marca como paga, então ela sai da lista de pendentes e registra a data informada.
- Dado uma mensalidade marcada como paga por engano, então a secretária consegue desfazer.

## Constraints & dependencies

- **Usabilidade é o requisito principal**: público 40+, migrando do papel. Telas com uma tarefa cada, textos curtos em português do dia a dia, botões grandes.
- Professoras usam o **celular próprio**; secretária e direção, principalmente o **computador da escola**. A interface deve funcionar bem nos dois.
- Depende de internet na sala (informado como "em geral funciona").
- **LGPD**: dados de menores — guardar só o mínimo listado; acesso a dados financeiros restrito a secretária e direção.
- Escala pequena: até ~200 alunos, ~10 turmas, ~12 usuários.
- Carga inicial depende de a secretária preparar a planilha de alunos.

## Open questions

| Question | Owner | Status |
|---|---|---|
| Qual o valor da mensalidade e o dia de vencimento? | Direção | Aberta |
| Uma turma pode ter duas professoras (ex.: titular e auxiliar)? Se sim, quem faz a chamada? | Secretária | Aberta |
| Como lidar com dias sem aula (feriados, recesso) para não marcar turma como "chamada pendente"? | Secretária | Aberta |
| Aluno que entra ou sai no meio do mês paga o mês cheio? | Direção | Aberta |
| Quem é "direção" no sistema (quantas pessoas, um login próprio)? | Direção | Aberta |
| Quem dá suporte/treinamento inicial às professoras e o que acontece quando alguém esquece a senha? | Quem implanta + secretária | Aberta |
| Por quanto tempo guardar dados de alunos que saíram da escola (LGPD)? | Direção | Aberta |
