// Ficheiro: backend/src/controllers/userController.js
// Descrição: Contém a lógica para registo de utilizadores e para a exibição dinâmica do portal.

const db = require('../database/connection');
const bcrypt = require('bcryptjs');

/**
 * @desc    Determina qual template de portal deve ser exibido e retorna os seus detalhes, incluindo o banner.
 * @route   GET /api/portal?routerName=RT-000001
 * @access  Public
 */
const getPortalPage = async (req, res) => {
  const { routerName } = req.query;

  if (!routerName) {
    return res.status(400).json({ message: 'O nome do router (routerName) é obrigatório.' });
  }

  try {
    // 1. Executar a consulta do "Motor de Decisão" para obter o template_id
    const motorQuery = `
      WITH router_info AS (
        SELECT id, name, group_id FROM routers WHERE name = $1
      ),
      active_campaigns AS (
        SELECT id, template_id, target_type, target_id FROM campaigns
        WHERE is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date
      ),
      campaign_priority AS (
        SELECT c.template_id, 1 AS priority FROM active_campaigns c JOIN router_info ri ON c.target_type = 'single_router' AND c.target_id = ri.id
        UNION ALL
        SELECT c.template_id, 2 AS priority FROM active_campaigns c JOIN router_info ri ON c.target_type = 'group' AND c.target_id = ri.group_id
        UNION ALL
        SELECT c.template_id, 3 AS priority FROM active_campaigns c WHERE c.target_type = 'all'
      ),
      final_choice AS (
        SELECT template_id FROM campaign_priority ORDER BY priority ASC LIMIT 1
      )
      SELECT COALESCE(
        (SELECT template_id FROM final_choice),
        (SELECT
          CASE
            WHEN name LIKE 'RT-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão RT')
            WHEN name LIKE 'CS-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão CS')
            WHEN name LIKE 'VM-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão VM')
            WHEN name LIKE 'GB-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão GB')
            WHEN name LIKE 'MKT-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão MKT')
            WHEN name LIKE 'VIP-%' THEN (SELECT id FROM templates WHERE name = 'Template Padrão VIP')
            ELSE (SELECT id FROM templates WHERE name = 'Template Padrão Geral')
          END
          FROM router_info
        )
      ) AS template_id;
    `;
    const motorResult = await db.query(motorQuery, [routerName]);

    if (motorResult.rows.length === 0 || !motorResult.rows[0].template_id) {
      return res.status(404).json({ message: 'Nenhum template aplicável foi encontrado para este roteador.' });
    }

    const templateId = motorResult.rows[0].template_id;

    // --- ALTERAÇÃO CRUCIAL ---
    // 2. Com o ID, buscar todos os detalhes do template E do banner associado (se houver)
    const templateDetailsQuery = `
      SELECT 
        t.*, 
        b.image_url as banner_image_url, 
        b.target_url as banner_target_url, 
        b.display_time_seconds as banner_display_time
      FROM templates t
      LEFT JOIN banners b ON t.prelogin_banner_id = b.id
      WHERE t.id = $1;
    `;
    const templateDetailsResult = await db.query(templateDetailsQuery, [templateId]);

    if (templateDetailsResult.rows.length === 0) {
      return res.status(404).json({ message: `Template com ID ${templateId} não encontrado.` });
    }

    // 3. Enviar os detalhes combinados do template e do banner para o frontend
    res.json(templateDetailsResult.rows[0]);

  } catch (error) {
    console.error(`Erro ao buscar portal para ${routerName}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Regista um novo utilizador nas tabelas do FreeRADIUS e de detalhes.
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { nomeCompleto, email, senha, telefone, mac, routerName } = req.body;
    try {
        if (!nomeCompleto || !email || !senha || !telefone || !mac || !routerName) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }
        const userExists = await db.query('SELECT username FROM radcheck WHERE username = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'Este e-mail já está registado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);
        const radCheckQuery = `
            INSERT INTO radcheck (username, attribute, op, value) 
            VALUES ($1, 'Crypt-Password', ':=', $2)
        `;
        await db.query(radCheckQuery, [email, hashedPassword]);
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
        await db.query('DELETE FROM radcheck WHERE username = $1', [email]);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getPortalPage,
    registerUser,
};

