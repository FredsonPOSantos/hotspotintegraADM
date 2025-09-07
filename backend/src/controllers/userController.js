const db = require('../database/connection');
const bcrypt = require('bcryptjs');

/**
 * @desc    Regista um novo utilizador nas tabelas do FreeRADIUS e de detalhes.
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { nomeCompleto, email, senha, telefone, mac, routerName } = req.body;

    try {
        // Validação dos dados de entrada
        if (!nomeCompleto || !email || !senha || !telefone || !mac || !routerName) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }

        // Verifica se o utilizador (e-mail) já existe na tabela radcheck
        const userExists = await db.query('SELECT username FROM radcheck WHERE username = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'Este e-mail já está registado.' });
        }

        // Criptografa a senha para ser guardada na base de dados
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        // Insere os dados de autenticação na tabela 'radcheck'
        // O FreeRADIUS usará estes dados para validar o login
        const radCheckQuery = `
            INSERT INTO radcheck (username, attribute, op, value) 
            VALUES ($1, 'Crypt-Password', ':=', $2)
        `;
        await db.query(radCheckQuery, [email, hashedPassword]);

        // Insere os dados adicionais na nossa tabela 'userdetails'
        const userDetailsQuery = `
            INSERT INTO userdetails (username, nome_completo, telefone, mac_address, router_name) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(userDetailsQuery, [email, nomeCompleto, telefone, mac, routerName]);

        res.status(201).json({
            message: 'Utilizador registado com sucesso!',
        });

    } catch (error) {
        console.error('Erro ao registar utilizador:', error);
        // Em caso de erro, é uma boa prática remover o utilizador da 'radcheck' se ele foi inserido
        await db.query('DELETE FROM radcheck WHERE username = $1', [email]);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    registerUser,
};
