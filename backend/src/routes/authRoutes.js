// Importa o framework Express para criar o roteador
const express = require('express');
// Cria uma instância do roteador do Express
const router = express.Router();

// Importa as funções de registro e login de usuário do nosso controller
const { registerUser, loginUser } = require('../controllers/userController');

// Define a rota para o registro de usuários.
// Quando uma requisição POST for feita para a URL '/register',
// a função 'registerUser' será executada.
router.post('/register', registerUser);

// Define a rota para o login de usuários.
// Quando uma requisição POST for feita para a URL '/login',
// a função 'loginUser' será executada.
router.post('/login', loginUser);

// Exporta o roteador para que ele possa ser usado no arquivo principal do servidor (server.js)
module.exports = router;
