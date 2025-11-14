const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis de ambiente
const authRoutes = require('./src/routes/authRoutes');

// Inicializa a ligação à base de dados PostgreSQL
const db = require('./src/database/connection');

const app = express();

// Middlewares essenciais
app.use(cors()); // Permite que o nosso frontend comunique com o backend
app.use(express.json()); // Permite que o servidor entenda JSON

// Define a rota principal da nossa API (agora apenas com o registo)
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});
