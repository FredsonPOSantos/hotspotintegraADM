const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Carrega as variáveis de ambiente

// Inicializa a ligação à base de dados PostgreSQL
const pool = require('./src/database/connection');

const app = express();

// Middlewares essenciais
app.use(cors()); // Permite que o nosso frontend comunique com o backend
app.use(express.json()); // Permite que o servidor entenda JSON
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Servir ficheiros estáticos (CSS, JS, imagens) da pasta 'public'
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Rota para a raiz, que será tratada pela rota principal abaixo
app.get('/', (req, res) => {
    // Redireciona para /index.html mantendo os query params, que será capturado pela rota :page
    res.redirect(307, `/index.html${req.url.slice(1).includes('?') ? '' : '?'}${req.url.slice(1)}`);
});

// Rota principal que renderiza as páginas de login e registo
app.get('/:page', async (req, res, next) => {
    const { routerName } = req.query;
    const requestedPage = req.params.page;

    // Validação para garantir que apenas as páginas que queremos renderizar dinamicamente são tratadas aqui.
    if (requestedPage !== 'index.html' && requestedPage !== 'register.html') {
        // Se não for uma das nossas páginas, passa para o próximo middleware (que pode ser um 404).
        return next();
    }

    const pageToRender = requestedPage.replace('.html', ''); // 'index' ou 'register'

    console.log(`[SRV-HOTSPOT] Recebida requisição para renderizar a página: '${pageToRender}.ejs' para o roteador: '${routerName}'`);

    let campaignData = {
        use_default: true,
        template: {},
        preLoginBanner: null,
        postLoginBanners: [],
        loginPageSettings: {},
        // Adiciona o endereço do servidor ADM para construir URLs de imagem
        admServerUrl: `http://${process.env.ADM_SERVER_IP || '127.0.0.1'}:${process.env.ADM_SERVER_PORT || 3000}`
    };

    try {
        // 1. Busca as configurações gerais do sistema como fallback
        const settingsResult = await pool.query('SELECT * FROM system_settings WHERE id = 1');
        campaignData.loginPageSettings = settingsResult.rows[0] || {};

        // 2. Se um routerName foi fornecido, busca a campanha
        if (routerName) {
            const routerResult = await pool.query('SELECT id, group_id FROM routers WHERE name = $1', [routerName]);
            const router = routerResult.rows[0];

            if (router) {
                const campaignQuery = `
                    SELECT * FROM campaigns
                    WHERE is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date
                    AND (
                        (target_type = 'single_router' AND target_id = $1) OR
                        (target_type = 'group' AND target_id = $2) OR
                        (target_type = 'all')
                    )
                    ORDER BY CASE target_type WHEN 'single_router' THEN 1 WHEN 'group' THEN 2 ELSE 3 END
                    LIMIT 1;
                `;
                const campaignResult = await pool.query(campaignQuery, [router.id, router.group_id]);

                if (campaignResult.rows.length > 0) {
                    const activeCampaign = campaignResult.rows[0];
                    console.log(`[SRV-HOTSPOT] Campanha encontrada: "${activeCampaign.name}" (ID: ${activeCampaign.id})`);

                    const templateQuery = `
                        SELECT t.*, 
                               b.image_url AS pre_login_banner_url, 
                               b.target_url AS pre_login_target_url,
                               b.display_time_seconds AS pre_login_banner_time
                        FROM templates t
                        LEFT JOIN banners b ON t.prelogin_banner_id = b.id AND b.type = 'pre-login' AND b.is_active = true
                        WHERE t.id = $1;
                    `;
                    const templateResult = await pool.query(templateQuery, [activeCampaign.template_id]);
                    const templateData = templateResult.rows[0] || {};

                    // Atualiza o objeto campaignData com os dados encontrados
                    campaignData.use_default = false;
                    campaignData.template = {
                        name: templateData.name,
                        loginType: templateData.login_type,
                        primaryColor: templateData.primary_color,
                        fontColor: templateData.font_color,
                        fontSize: templateData.font_size,
                        backgroundUrl: templateData.login_background_url,
                        logoUrl: templateData.logo_url
                    };
                    if (templateData.pre_login_banner_url) {
                        campaignData.preLoginBanner = {
                            imageUrl: `${campaignData.admServerUrl}${templateData.pre_login_banner_url}`,
                            targetUrl: templateData.pre_login_target_url,
                            displayTime: templateData.pre_login_banner_time || 5
                        };
                    }
                    // A lógica para banners pós-login pode ser adicionada aqui se necessário no futuro

                } else {
                    console.log(`[SRV-HOTSPOT] Nenhuma campanha ativa encontrada para o roteador '${routerName}'.`);
                }
            } else {
                console.log(`[SRV-HOTSPOT] Roteador '${routerName}' não encontrado no banco de dados.`);
            }
        }
    } catch (error) {
        console.error(`[SRV-HOTSPOT] Erro ao processar a requisição para a página '${pageToRender}.ejs':`, error);
        // Em caso de erro, renderiza a página com os dados padrão para não quebrar
    }

    console.log(`[SRV-HOTSPOT] Renderizando '${pageToRender}.ejs' com os dados da campanha.`);

    res.render(pageToRender, { campaign: campaignData, query: req.query });
});

const PORT = process.env.PORT || 3001; // Porta 3001 conforme o nosso plano

const startServer = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ [SRV-HOTSPOT] Conectado com sucesso ao PostgreSQL!');
        client.release();

        app.listen(PORT, () => {
            console.log(`✅ [SRV-HOTSPOT] Servidor de portal iniciado e a escutar na porta ${PORT}`);
        });
    } catch (error) {
        console.error('❌ [SRV-HOTSPOT] ERRO CRÍTICO: Não foi possível conectar à base de dados.', error);
        process.exit(1);
    }
};

startServer();
