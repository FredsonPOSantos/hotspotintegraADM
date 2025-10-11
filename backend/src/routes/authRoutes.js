const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');

// Na nova arquitetura, a única responsabilidade do nosso servidor é o registo.
// A rota de login foi removida, pois a autenticação é agora gerida pelo FreeRADIUS.
router.post('/register', registerUser);

module.exports = router;