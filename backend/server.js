const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // [NOVO] Para fazer chamadas de API
require('dotenv').config(); // Carrega as variáveis de ambiente
// [CRÍTICO] Mapeia as variáveis de ambiente do ecosystem.config.js (com prefixo DB_)
// para as variáveis que a biblioteca 'pg' espera (com prefixo PG_).
// Isto permite que a ligação à base de dados funcione em produção com PM2.
if (process.env.DB_HOST) {
    process.env.PGHOST = process.env.DB_HOST;
    process.env.PGUSER = process.env.DB_USER;
    process.env.PGPASSWORD = process.env.DB_PASSWORD;
    process.env.PGDATABASE = process.env.DB_DATABASE;
    process.env.PGPORT = process.env.DB_PORT;
}

// [MELHORIA] Validação para garantir que as variáveis de ambiente essenciais da DB estão definidas.
// Isto irá falhar rapidamente com uma mensagem clara se o ficheiro .env ou ecosystem.config.js não for carregado corretamente.
const requiredDbEnvVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT'];
const missingDbVar = requiredDbEnvVars.find(v => !process.env[v]);
if (missingDbVar) {
    console.error(`❌ [SRV-HOTSPOT] ERRO CRÍTICO: A variável de ambiente da base de dados '${missingDbVar.replace('PG','DB_')}' não está definida. Verifique o seu ficheiro .env ou ecosystem.config.js.`);
    process.exit(1);
}
 
// Inicializa a ligação à base de dados PostgreSQL
// [CORRIGIDO] Aponta para o caminho de conexão correto dentro da estrutura do projeto Hotspot.
const pool = require('./src/database/connection');

const app = express();

// Middlewares essenciais
app.use(cors()); // Permite que o nosso frontend comunique com o backend
app.use(express.json()); // Permite que o servidor entenda JSON
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views')); // [CORRIGIDO] Aponta para a pasta de views correta.

// Servir ficheiros estáticos (CSS, JS, imagens) da pasta 'public'
app.use(express.static(path.join(__dirname, '../frontend/public'))); // [CORRIGIDO] Aponta para a pasta public correta.

// [NOVO] Rota para servir as páginas de políticas
app.get('/policy/:type', async (req, res) => {
    const { type } = req.params;
    let contentColumn = '';
    let pageTitle = '';

    if (type === 'terms') {
        contentColumn = 'terms_content';
        pageTitle = 'Termos e Condições';
    } else if (type === 'promotions') {
        contentColumn = 'marketing_policy_content';
        pageTitle = 'Política de Sorteios e Promoções';
    } else {
        return res.status(404).send('Página não encontrada.');
    }

    try {
        const result = await pool.query(`SELECT ${contentColumn} FROM system_settings WHERE id = 1`);
        if (result.rows.length === 0 || !result.rows[0][contentColumn]) {
            return res.status(404).send('Conteúdo não disponível.');
        }

        const content = result.rows[0][contentColumn];
        res.render('policy_page', { title: pageTitle, content: content });

    } catch (error) {
        console.error(`Erro ao buscar política do tipo '${type}':`, error);
        res.status(500).send('Erro ao carregar a página.');
    }
});


// Rota para a raiz, que será tratada pela rota principal abaixo
app.get('/', (req, res) => {
    // Redireciona para /index.html mantendo os query params, que será capturado pela rota :page
    res.redirect(307, `/index.html${req.url.slice(1).includes('?') ? '' : '?'}${req.url.slice(1)}`);
});

// Rota principal que renderiza as páginas de login e registo
app.get('/:page', async (req, res, next) => {
    const { routerName, previewCampaignId } = req.query; // [MODIFICADO] Captura ambos os parâmetros
    const requestedPage = req.params.page;

    // [MELHORIA] Remove a extensão .html (se existir) para obter o nome base da página.
    const pageToRender = requestedPage.replace('.html', ''); // 'index', 'register', ou 'success'

    // [MELHORIA] Valida se o nome base da página está na lista de páginas permitidas.
    // Isto torna a rota mais flexível, aceitando tanto /index.html como /index.
    const allowedPages = ['index', 'register', 'success'];
    if (!allowedPages.includes(pageToRender)) {
        // Se não for uma das nossas páginas dinâmicas, passa para o próximo middleware (ex: servir ficheiros estáticos).
        return next();
    }

    console.log(`[SRV-HOTSPOT] Recebida requisição para renderizar a página: '${pageToRender}.ejs'`);

    let campaignData = {
        use_default: true,
        template: {},
        preLoginBanner: null, // Banner para a página de login
        postLoginBanner: null, // [NOVO] Banner para a página de sucesso
        postLoginBanners: [],
        // Adiciona o endereço do servidor ADM para construir URLs de imagem
        admServerUrl: `http://${process.env.ADM_SERVER_IP || '127.0.0.1'}:${process.env.ADM_SERVER_PORT || 3000}`
    };

    try {
        // --- [NOVA LÓGICA DE PRÉ-VISUALIZAÇÃO] ---
        if (previewCampaignId) {
            console.log(`[SRV-HOTSPOT] Modo Pré-visualização para Campanha ID: ${previewCampaignId}`);
            const previewApiUrl = `${campaignData.admServerUrl}/api/public/campaign-preview?campaignId=${previewCampaignId}`;
            const apiResponse = await fetch(previewApiUrl);

            if (apiResponse.ok) {
                const previewData = await apiResponse.json();
                // Mapeia os dados da API de pré-visualização para a estrutura que o template espera
                if (previewData && !previewData.use_default) {
                    campaignData.use_default = false;
                    campaignData.template = previewData.template; // A API já retorna a estrutura correta
                    // [CORRIGIDO] Adiciona a atribuição do banner de pré-login que estava em falta.
                    campaignData.preLoginBanner = previewData.preLoginBanner;
                    campaignData.postLoginBanner = previewData.postLoginBanner;
                    // Adicionamos uma flag para o template saber que está em modo de pré-visualização
                    campaignData.isPreview = true;
                }
            } else {
                console.error(`[SRV-HOTSPOT] Erro ao buscar dados de pré-visualização: ${apiResponse.statusText}`);
            }
        } 
        // --- FIM DA LÓGICA DE PRÉ-VISUALIZAÇÃO ---
        else if (routerName) {
            /*
            // --- [MODIFICAÇÃO FUTURA] ---
            // No futuro, para centralizar a lógica, podemos substituir a query direta
            // por uma chamada de API ao servidor Admin, similar ao modo de pré-visualização.
            // Isso tornaria o Portal Hotspot mais "burro" e o Admin mais "inteligente".
            
            console.log(`[SRV-HOTSPOT] Buscando campanha via API para o roteador: ${routerName}`);
            const campaignApiUrl = `${campaignData.admServerUrl}/api/public/campaign-by-router?routerName=${routerName}`;
            const apiResponse = await fetch(campaignApiUrl);

            if (apiResponse.ok) {
                const liveCampaignData = await apiResponse.json();
                if (liveCampaignData && !liveCampaignData.use_default) {
                    campaignData = { ...campaignData, ...liveCampaignData }; // Mescla os dados da API
                }
            } else {
                console.error(`[SRV-HOTSPOT] Erro ao buscar dados de campanha via API: ${apiResponse.statusText}`);
            }
            // --- FIM DA MODIFICAÇÃO FUTURA ---
            */

            // --- LÓGICA NORMAL (EXISTENTE) ---
            console.log(`[SRV-HOTSPOT] Modo Normal para Roteador: ${routerName}`);
            const routerResult = await pool.query('SELECT id, group_id FROM routers WHERE name = $1', [routerName]);
            const router = routerResult.rows[0];

            if (router) {
                const campaignQuery = `
                    SELECT * FROM campaigns
                    WHERE is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date
                    AND ((target_type = 'single_router' AND target_id = $1) OR (target_type = 'group' AND target_id = $2) OR (target_type = 'all'))
                    ORDER BY CASE target_type WHEN 'single_router' THEN 1 WHEN 'group' THEN 2 ELSE 3 END
                    LIMIT 1;
                `;
                const campaignResult = await pool.query(campaignQuery, [router.id, router.group_id]);

                if (campaignResult.rows.length > 0) {
                    const activeCampaign = campaignResult.rows[0];
                    console.log(`[SRV-HOTSPOT] Campanha ativa encontrada: "${activeCampaign.name}"`);

                    // [REFEITO] A lógica foi separada para maior clareza e alinhamento com o resto do sistema.
                    // 1. Busca o template e seu banner de pré-login associado.
                    const templateQuery = `
                        SELECT t.*, 
                               b_pre.image_url AS pre_login_banner_url,
                               b_pre.target_url AS pre_login_target_url
                        FROM templates t
                        LEFT JOIN banners AS b_pre ON t.prelogin_banner_id = b_pre.id AND b_pre.type = 'pre-login' AND b_pre.is_active = true
                        WHERE t.id = $1;
                    `;
                    const templateResult = await pool.query(templateQuery, [activeCampaign.template_id]);
                    const templateData = templateResult.rows[0];

                    if (templateData) {                        
                        campaignData.use_default = false;

                        // Popula o banner de pré-login (associado ao template)
                        if (templateData.pre_login_banner_url) {
                            campaignData.preLoginBanner = {
                                imageUrl: templateData.pre_login_banner_url,
                                targetUrl: templateData.pre_login_target_url
                            };
                        }

                        // Popula os dados do template
                        campaignData.template = {
                            loginType: templateData.login_type,
                            primaryColor: templateData.primary_color,
                            fontColor: templateData.font_color,
                            fontSize: templateData.font_size,
                            formBackgroundColor: templateData.form_background_color,
                            fontFamily: templateData.font_family,
                            backgroundUrl: templateData.login_background_url,
                            logoUrl: templateData.logo_url,
                            statusTitle: templateData.status_title,
                            statusMessage: templateData.status_message,
                            statusLogoUrl: templateData.status_logo_url || templateData.logo_url,
                            statusBgColor: templateData.status_bg_color,
                            statusBgImageUrl: templateData.status_bg_image_url,
                            statusH1FontSize: templateData.status_h1_font_size,
                            statusPFontSize: templateData.status_p_font_size,
                        };

                        // 2. Busca os banners de pós-login (associados à CAMPANHA, não ao template)
                        const postLoginBannersQuery = `
                            SELECT b.image_url, b.target_url
                            FROM campaign_banners cb
                            JOIN banners b ON cb.banner_id = b.id
                            WHERE cb.campaign_id = $1 AND b.type = 'post-login' AND b.is_active = true
                            ORDER BY cb.placeholder_id ASC;
                        `;
                        const postLoginBannersResult = await pool.query(postLoginBannersQuery, [activeCampaign.id]);

                        // A página de sucesso atual só suporta um banner. Usamos o primeiro encontrado.
                        if (postLoginBannersResult.rows.length > 0) {
                            campaignData.postLoginBanner = {
                                imageUrl: postLoginBannersResult.rows[0].image_url,
                                targetUrl: postLoginBannersResult.rows[0].target_url
                            };
                        }
                    }
                } else {
                    console.log(`[SRV-HOTSPOT] Nenhuma campanha ativa encontrada para o roteador '${routerName}'.`);
                }
            } else {
                console.log(`[SRV-HOTSPOT] Roteador '${routerName}' não encontrado no banco de dados.`);
            }
        } else {
             console.log(`[SRV-HOTSPOT] Nenhum parâmetro (routerName ou previewCampaignId) fornecido. Usando layout padrão.`);
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
