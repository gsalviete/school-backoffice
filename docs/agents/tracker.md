# Tracker

Where cards live. Markdown local: cada card é um arquivo em `tasks/` (formato em `shared/card-format.md` do ship-it).
GitHub Issues fica disponível quando o `gh` CLI for instalado e autenticado — basta trocar `platform` aqui.

```
platform: markdown
scope: tasks/
product_docs: docs/product/
base_branch: main              # remote origin ainda vazio; main é o branch local atual
language: user                 # cards no idioma de quem usa (pt-BR)
```
