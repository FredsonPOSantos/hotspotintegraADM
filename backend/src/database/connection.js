const { Pool } = require('pg');

// [MELHORIA] O construtor do Pool() lê automaticamente as variáveis de ambiente PG*
// (PGHOST, PGUSER, PGPASSWORD, etc.). Como o nosso server.js já faz o mapeamento
// de DB_* para PG_*, não precisamos de passar os parâmetros aqui.
// Isso torna o código mais limpo e segue a convenção da biblioteca 'pg'.
const pool = new Pool();

// [MANUTENÇÃO] Este "ouvinte" de erros é uma boa prática. Ele captura erros
// em clientes inativos na pool e encerra o processo para que o PM2 possa reiniciá-lo,
// garantindo a estabilidade do servidor.
pool.on('error', (err) => {
    console.error('❌ [DB-POOL] Erro inesperado no cliente da base de dados (idle client). A reiniciar...', err);
    process.exit(-1);
});

module.exports = pool;
