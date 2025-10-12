// Ficheiro: backend/server.js (do seu portal de hotspot)

const express = require('express');
const cors = require('cors'); // Importa o pacote CORS
require('dotenv').config(); // Carrega as variáveis de ambiente

// Importa a conexão com a base de dados para garantir que está disponível
require('./src/database/connection');

// Importa as rotas de autenticação e do portal
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3002; // Usando a porta do seu ficheiro anterior

// --- MIDDLEWARES ---
app.use(cors()); // <-- ATIVA O CORS PARA PERMITIR PEDIDOS DE OUTRAS ORIGENS (ex: frontend na porta 8081)
app.use(express.json()); // Permite que o servidor entenda o corpo de requisições JSON

// --- ROTAS ---
// Usa o prefixo /api para todas as rotas definidas em authRoutes.
// Isto resulta nos endpoints: GET /api/portal e POST /api/register
app.use('/api', authRoutes);

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor do Portal Hotspot a correr na porta ${PORT}`);
});

