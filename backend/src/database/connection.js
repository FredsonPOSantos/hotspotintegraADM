// Ficheiro: connection.js
// Descrição: Centraliza e valida a conexão com a base de dados PostgreSQL (SRV-PORTAL)

require('dotenv').config();
const { Pool } = require('pg');

// Cria a pool de conexões usando as variáveis de ambiente
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 10,               // máximo de conexões simultâneas
  idleTimeoutMillis: 30000, // fecha conexões ociosas após 30s
});

// Evento: ligação estabelecida
pool.on('connect', () => {
  console.log('✅ [SRV-PORTAL] Ligação com o PostgreSQL estabelecida com sucesso!');
});

// Evento: erro inesperado
pool.on('error', (err) => {
  console.error('❌ [SRV-PORTAL] Erro inesperado no cliente da base de dados:', err);
  process.exit(-1);
});

// Teste e validação detalhada da conexão
(async () => {
  const startTime = Date.now();
  try {
    const client = await pool.connect();
    const duration = Date.now() - startTime;

    const result = await client.query(`
      SELECT current_database() AS database,
             current_user AS user,
             inet_server_addr() AS host,
             inet_server_port() AS port;
    `);

    const info = result.rows[0];

    console.log('\n🔍 [SRV-PORTAL] Detalhes da conexão PostgreSQL:');
    console.log(`   🧑 Usuário conectado: ${info.user}`);
    console.log(`   🗃️ Banco de dados:     ${info.database}`);
    console.log(`   🌐 Host:               ${info.host}`);
    console.log(`   🔌 Porta:              ${info.port}`);
    console.log(`   ⚡ Tempo de conexão:   ${duration} ms\n`);

    console.log('✅ [SRV-PORTAL] Conectado com sucesso no PostgreSQL!\n');

    client.release();
  } catch (err) {
    console.error('🚨 [SRV-PORTAL] Falha ao conectar ao PostgreSQL:', err.message);
    process.exit(1);
  }
})();

// Wrapper para logar queries
async function query(text, params) {
  const startTime = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - startTime;
    console.log(`🟢 [SRV-PORTAL] QUERY OK: "${text}" (${duration} ms)`);
    return res;
  } catch (err) {
    console.error(`❌ [SRV-PORTAL] QUERY ERRO: "${text}"`);
    console.error('   Mensagem:', err.message);
    throw err;
  }
}

module.exports = { query };
