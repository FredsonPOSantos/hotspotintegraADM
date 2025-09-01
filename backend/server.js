// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa os frameworks e módulos necessários
const express = require('express');
const cors = require('cors'); // Importa o pacote CORS
const connectDB = require('./src/database/connection');
const authRoutes = require('./src/routes/authRoutes');

// Executa a conexão com o MongoDB
connectDB();

// Cria uma instância do aplicativo Express
const app = express();

// --- CONFIGURAÇÃO DO CORS ---
// Middleware para permitir requisições de outras origens (do nosso frontend)
app.use(cors());

// Middleware para permitir que o Express entenda requisições com corpo em JSON
app.use(express.json());

// Define a porta em que o servidor irá rodar
const PORT = process.env.PORT || 3000;

// Rota principal para teste
app.get('/', (req, res) => {
  res.send('API Rota_Hotspot está no ar!');
});

// Usa as rotas de autenticação para qualquer URL que comece com /api/auth
app.use('/api/auth', authRoutes);

// Inicia o servidor e o faz "escutar" por requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
