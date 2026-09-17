# Execução com SQLite

Requer Node.js 22.16 ou superior. Execute `npm install` e `npm start`
(ou `node index.js`). A porta continua sendo configurada por `PORT` no `.env`.

O aplicativo abre `blockchain.sqlite` na pasta do projeto. Opcionalmente,
configure `SQLITE_PATH` no ambiente ou no `.env`; caminhos relativos são
resolvidos a partir da pasta do projeto. O arquivo deve existir: um caminho
incorreto gera erro, em vez de criar um banco vazio.

`CONNECTION_STRING` não é mais utilizada. Não há conexão com MySQL.
O acesso utiliza o módulo nativo `node:sqlite`, sem driver externo.

As datas migradas são interpretadas em UTC e os campos JSON voltam como
objetos. O cálculo do hash Cuckoo preserva o limite histórico de 1.024
caracteres da concatenação, necessário para conferir os hashes já gravados.
As transações usam `BEGIN IMMEDIATE` e uma fila compartilhada impede que
operações concorrentes participem da transação de outra requisição.

Execute `node --test sqlite.test.js` para verificar leituras, hashes dos
blocos migrados, hash do filtro, transações, concorrência e rotas HTTP.
As escritas dos testes acontecem somente em uma cópia temporária do banco.
