const db = require('../database/connection');
const bcrypt = require('bcryptjs');
// const emailValidator = require('deep-email-validator'); // [PENDENTE] Descomente para ativar validação de e-mail real

/**
 * @desc    Regista um novo utilizador nas tabelas do FreeRADIUS e de detalhes.
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    // [CORRIGIDO] Lê os valores dos checkboxes que vêm do frontend
    const { nomeCompleto, email, senha, telefone, mac, routerName, terms_accepted, accepts_marketing } = req.body;

    try {
        // Validação dos dados de entrada
        if (!nomeCompleto || !email || !senha || !telefone || !mac || !routerName) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }

        // [MELHORIA] Adiciona validação de segurança no backend para os termos
        if (terms_accepted !== true) {
            return res.status(400).json({ message: 'É obrigatório aceitar os Termos e Condições para se registar.' });
        }

        /* 
        // [PENDENTE] Validação de E-mail Avançada
        // Verifica se o e-mail é real, se o domínio existe e se não é temporário.
        // Requer instalar o pacote: npm install deep-email-validator
        // Certifique-se de descomentar o 'require' no topo do arquivo também.
        
        const { valid, reason, validators } = await emailValidator.validate(email);
        if (!valid) {
            let errorMessage = 'O endereço de e-mail fornecido não é válido.';
            if (reason === 'disposable') errorMessage = 'E-mails temporários não são permitidos.';
            if (reason === 'typo') errorMessage = `Você quis dizer ${validators.typo?.source}?`;
            if (reason === 'mx') errorMessage = 'O domínio do e-mail não existe ou não pode receber mensagens.';
            
            return res.status(400).json({ message: errorMessage });
        }
        */

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
        // [CORRIGIDO] A query foi ajustada para corresponder à estrutura da tabela da base de dados,
        // utilizando 'terms_accepted_at' e 'accepts_marketing'.
        const userDetailsQuery = `
            INSERT INTO userdetails (username, nome_completo, telefone, mac_address, router_name, terms_accepted_at, accepts_marketing) 
            VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        `;
        await db.query(userDetailsQuery, [email, nomeCompleto, telefone, mac, routerName, !!accepts_marketing]);

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
