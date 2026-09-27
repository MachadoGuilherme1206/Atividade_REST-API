# API de Controle de Produção

API REST (Node.js + Express) para gerenciar ordens de produção e gerar
relatórios consolidados. Os dados são persistidos em MySQL.

## Como rodar

1. Instalar as dependências:

   ```
   npm install
   ```

2. Criar o banco e a tabela (cria o database `controle_producao`,
   a tabela `ordens` e insere 4 ordens de exemplo):

   ```
   mysql -u root -p < docs/banco.sql
   ```

3. Conferir as credenciais em `models/Banco.js` (`HOST`, `USER`, `PASSWORD`,
   `DATABASE`, `PORT`) e ajustar se o seu MySQL usar outras.

4. Subir o servidor (porta 3000):

   ```
   npm start
   ```

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/ordens` | Cadastra uma ordem. 201 no sucesso, 400 em erro de validação. |
| GET | `/ordens` | Lista as ordens. Filtros opcionais: `?tipo=2`, `?alerta=ALTO`. |
| GET | `/ordens/:codigoOrdem` | Busca uma ordem. 404 se não existir. |
| PUT | `/ordens/:codigoOrdem` | Atualiza uma ordem. Aceita envio parcial: o campo ausente mantém o valor atual. 404 se não existir. |
| DELETE | `/ordens/:codigoOrdem` | Remove uma ordem. 404 se não existir. |
| GET | `/relatorios/ordens` | Relatório consolidado de todas as ordens. |

### Campos da ordem

Enviados pelo cliente: `codigoOrdem` (único), `codigoProduto`, `tipoProduto`
(1–Padrão, 2–Premium, 3–Sob encomenda), `quantidadeProduzida`,
`custoUnitarioBase`, `estoqueInicial`.

Calculados pelo servidor:

- `estoqueFinal` = `estoqueInicial` + `quantidadeProduzida`
- `custoUnitarioAjustado` = custo base, +10% (tipo 2) ou +20% (tipo 3)
- `custoTotal` = `quantidadeProduzida` × `custoUnitarioAjustado`
- `alertaEstoque` = `ALTO` (estoqueFinal > 5000), `CRITICO` (< 500) ou `NORMAL`

## Testando no Insomnia

O arquivo [`docs/insomnia_ordens.json`](docs/insomnia_ordens.json) é uma collection
pronta com as 22 requisições (todos os endpoints, os filtros e os casos de erro).

Para importar: **Application → Preferences → Data → Import Data → From File**,
ou o botão **Import** na tela de collections, e selecionar o arquivo.

A collection usa a variável de ambiente `base_url`, já configurada como
`http://localhost:3000`. Se o servidor rodar em outra porta, basta alterar essa
variável em **Manage Environments**.

As requisições estão agrupadas em quatro pastas:

- **Ordens** — o CRUD completo, na ordem de execução (POST → GET → PUT → DELETE)
- **Filtros** — `?tipo=`, `?alerta=` e os dois combinados
- **Validações** — os casos que devem retornar 400 ou 404
- **Relatórios** — o relatório consolidado

Cada requisição traz na descrição o status e os valores esperados na resposta.

### Exemplo

```
curl -X POST http://localhost:3000/ordens \
  -H "Content-Type: application/json" \
  -d '{"codigoOrdem":"OP010","codigoProduto":"PROD-A","tipoProduto":2,
       "quantidadeProduzida":3000,"custoUnitarioBase":80,"estoqueInicial":3000}'
```

## Estrutura

```
app.js                          ponto de entrada
servidor.js                     configuração do Express e das rotas
routes/ordemRoutes.js           rotas de /ordens
routes/relatorioRoutes.js       rota de /relatorios
middlewares/ordemMiddleware.js  validações de entrada
controllers/ordemController.js  regras de negócio e relatório
models/Ordem.js                 acesso à tabela ordens
models/Banco.js                 conexão MySQL
docs/banco.sql                  script de criação do banco
docs/insomnia_ordens.json       collection do Insomnia para testes
```
