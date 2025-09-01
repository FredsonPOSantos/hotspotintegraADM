// backend/src/database/connection.js

// Importa o mongoose para a conexão com o MongoDB
const mongoose = require('mongoose');

// Obtém a URI de conexão do MongoDB a partir das variáveis de ambiente
// A variável de ambiente é carregada no server.js, garantindo que esteja disponível aqui
const mongoURI = process.env.MONGO_URI;

// Função assíncrona para estabelecer a conexão com o banco de dados
const connectDB = async () => {
    try {
        // Tenta se conectar ao MongoDB usando a URI
        await mongoose.connect(mongoURI);
        console.log('Conexão com o MongoDB estabelecida com sucesso!');
    } catch (error) {
        // Se a conexão falhar, exibe uma mensagem de erro no console
        console.error('Falha ao conectar com o MongoDB:', error);
        // Encerra o processo do servidor com um código de erro
        process.exit(1);
    }
};

// Exporta a função para que ela possa ser usada em outros arquivos, como o server.js
module.exports = connectDB;