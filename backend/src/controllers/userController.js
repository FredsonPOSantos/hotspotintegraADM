const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { authorizeUserInHotspot } = require('../mikrotik/mikrotikController');

/**
 * @desc    Gera um token JWT para autenticação.
 * @param   {string} id - O ID do utilizador do MongoDB.
 * @returns {string} - O token JWT gerado.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // O token pode ter uma longa duração, a sessão é controlada pelo MikroTik
    });
};

/**
 * @desc    Regista um novo utilizador no sistema.
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    // Extrai todos os dados do corpo da requisição, incluindo o novo routerName
    const { nomeCompleto, email, senha, telefone, mac, routerName } = req.body;

    try {
        // Validação extra para garantir que os dados essenciais foram enviados
        if (!nomeCompleto || !email || !senha || !telefone || !mac || !routerName) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }

        // Verifica se já existe um utilizador com o mesmo e-mail ou MAC
        const userExists = await User.findOne({ $or: [{ email }, { mac }] });
        if (userExists) {
            return res.status(409).json({ message: 'Utilizador com este e-mail ou MAC já registado.' });
        }

        // Cria o novo utilizador no banco de dados, incluindo o routerName
        const user = await User.create({
            nomeCompleto,
            email,
            senha,
            telefone,
            mac,
            routerName, // Adiciona o nome do roteador ao criar o utilizador
        });

        // Se o utilizador for criado com sucesso, retorna os dados
        if (user) {
            res.status(201).json({
                _id: user._id,
                nomeCompleto: user.nomeCompleto,
                email: user.email,
                message: 'Utilizador registado com sucesso!',
            });
        } else {
            throw new Error('Dados do utilizador inválidos.');
        }
    } catch (error) {
        console.error('Erro ao registar utilizador:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Autentica um utilizador e autoriza o seu MAC no MikroTik.
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, senha, mac } = req.body;

    try {
        if (!email || !senha || !mac) {
            return res.status(400).json({ message: 'Dados de login incompletos.' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(senha))) {
            // Atualiza a data do último login
            user.ultimoLogin = Date.now();
            await user.save();

            // Autoriza o utilizador no MikroTik usando o novo método de perfis
            const authorized = await authorizeUserInHotspot(mac);
            if (!authorized) {
                throw new Error('Falha na autorização de rede.');
            }
            
            res.json({
                _id: user._id,
                nomeCompleto: user.nomeCompleto,
                email: user.email,
                token: generateToken(user._id),
                message: 'Login e autorização de rede realizados com sucesso!',
            });
        } else {
            res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
    } catch (error) {
        console.error('Erro no processo de login:', error);
        res.status(503).json({ message: 'Login bem-sucedido, mas falha ao autorizar o acesso à rede. Contate o suporte.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};

