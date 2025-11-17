const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // [NOVO] Para fazer chamadas de API
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
    const { routerName, previewCampaignId } = req.query; // [MODIFICADO] Captura ambos os parâmetros
    const requestedPage = req.params.page;

    // Validação para garantir que apenas as páginas que queremos renderizar dinamicamente são tratadas aqui.
    if (requestedPage !== 'index.html' && requestedPage !== 'register.html' && requestedPage !== 'success.html') {
        // Se não for uma das nossas páginas, passa para o próximo middleware (que pode ser um 404).
        return next();
    }

    const pageToRender = requestedPage.replace('.html', ''); // 'index' ou 'register'

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

                    const templateQuery = `
                        SELECT t.*, 
                               b_post.image_url AS post_login_banner_url,
                               b_post.target_url AS post_login_target_url
                        FROM templates t
                        LEFT JOIN banners AS b_post ON t.postlogin_banner_id = b_post.id AND b_post.type = 'post-login' AND b_post.is_active = true
                        WHERE t.id = $1;
                    `;
                    const templateResult = await pool.query(templateQuery, [activeCampaign.template_id]);
                    const templateData = templateResult.rows[0];

                    if (templateData) {
                        const admServerUrl = campaignData.admServerUrl;
                        campaignData.use_default = false;

                        // [CORRIGIDO] Restaura a lógica para a página de LOGIN
                        // e mantém a lógica para a página de STATUS.
                        campaignData.template = {
                            // --- Dados para a página de LOGIN ---
                            loginType: templateData.login_type,
                            primaryColor: templateData.primary_color,
                            fontColor: templateData.font_color,
                            fontSize: templateData.font_size,
                            formBackgroundColor: templateData.form_background_color,
                            fontFamily: templateData.font_family,
                            backgroundUrl: templateData.login_background_url 
                                ? (templateData.login_background_url.startsWith('http') 
                                    ? templateData.login_background_url 
                                    : `${admServerUrl}${templateData.login_background_url}`)
                                : null,
                            logoUrl: templateData.logo_url
                                ? (templateData.logo_url.startsWith('http')
                                    ? templateData.logo_url
                                    : `${admServerUrl}${templateData.logo_url}`)
                                : null,

                            // --- Dados para a página de STATUS ---
                            primaryColor: templateData.primary_color,
                            statusTitle: templateData.status_title,
                            statusMessage: templateData.status_message,
                            statusLogoUrl: (templateData.status_logo_url || templateData.logo_url) ? `${admServerUrl}${(templateData.status_logo_url || templateData.logo_url)}` : null,
                            statusBgColor: templateData.status_bg_color,
                            statusBgImageUrl: templateData.status_bg_image_url ? `${admServerUrl}${templateData.status_bg_image_url}` : null,
                            statusH1FontSize: templateData.status_h1_font_size,
                            statusPFontSize: templateData.status_p_font_size,
                        };

                        if (templateData.post_login_banner_url) {
                            campaignData.postLoginBanner = {
                                imageUrl: `${admServerUrl}${templateData.post_login_banner_url}`,
                                targetUrl: templateData.post_login_target_url
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
