// Ficheiro: backend/src/routes/authRoutes.js
// Descrição: Define as rotas públicas de autenticação e do portal.

const express = require('express');
const router = express.Router();
const { registerUser, getPortalPage } = require('../controllers/userController');

// --- Rota para obter a configuração do portal dinâmico ---
// Esta é a rota que o frontend irá chamar ao carregar a página.
router.get('/portal', getPortalPage);

// --- Rota para registar um novo utilizador ---
router.post('/register', registerUser);

module.exports = router;

