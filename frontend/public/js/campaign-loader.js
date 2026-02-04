// Ficheiro: rota-hotspot-WSL-Debian-ap-main/frontend/public/js/campaign-loader.js

// [CORRIGIDO] A URL base da API não deve ser fixa no código (hardcoded).

// [MELHORIA] Este script agora espera que uma variável global `API_BASE_URL` seja definida no HTML
// pelo template do lado do servidor (EJS). Isto torna o código flexível para diferentes ambientes.
// O servidor Node.js já passa esta URL como `campaign.admServerUrl`.

/**
 * Função principal que é executada quando a página termina de carregar.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Campaign Loader] Página carregada. A iniciar busca por campanha...');
    loadCampaign();
});

/**
 * [ALTERADO] Busca e aplica a campanha, seja ela ativa (via routerName) ou uma pré-visualização (via previewCampaignId).
 */
async function loadCampaign() {
    // [CORRIGIDO] Validação movida para o início da função.
    // Se a URL base da API não for injetada pelo servidor, nada mais pode funcionar.
    if (typeof window.API_BASE_URL === 'undefined' || !window.API_BASE_URL) {
        console.error('[Campaign Loader] A variável global `API_BASE_URL` não está definida. Não é possível carregar campanhas dinâmicas. Verifique se o template EJS está a injetá-la corretamente.');
        return;
    }

    // 1. Verifica se estamos em modo de pré-visualização
    const previewCampaignId = getUrlParameter('previewCampaignId');
    const routerName = getUrlParameter('routerName');

    let apiUrl = '';
    let isPreview = false;

    if (previewCampaignId) {
        // Modo de Pré-visualização
        console.log(`[Campaign Loader] Modo de Pré-visualização Ativado para Campanha ID: ${previewCampaignId}`);
        apiUrl = `${window.API_BASE_URL}/api/public/campaign-preview?campaignId=${previewCampaignId}`;
        isPreview = true;
    } else if (routerName) {
        // Modo Normal (Produção)
        console.log(`[Campaign Loader] Modo Normal. Buscando campanha para o roteador: ${routerName}`);
        apiUrl = `${window.API_BASE_URL}/api/public/active-campaign?routerName=${routerName}`;
    } else {
        // Nenhum parâmetro encontrado, carrega o layout padrão
        console.warn('[Campaign Loader] Nenhum parâmetro (routerName ou previewCampaignId) encontrado. A carregar layout padrão.');
        applyDefaultStylesFromApi(); // Tenta buscar as configurações de aparência padrão
        return; // Interrompe a execução
    }

    try {
        // 2. Chama a API apropriada (seja de pré-visualização ou de campanha ativa).
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`A resposta da API não foi OK: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Campaign Loader] Dados da campanha recebidos:', data);

        // 3. Renderiza o conteúdo dinâmico.
        if (data && !data.use_default) {
            console.log(`[Campaign Loader] Aplicando campanha ativa: "${data.campaign.name}"`);
            applyCampaign(data, isPreview); // Passa a flag de pré-visualização
        } else {
            console.log('[Campaign Loader] Nenhuma campanha ativa. A usar layout padrão.');
            // Aplica as configurações de aparência padrão retornadas pela API
            if (data.loginPageSettings) {
                applyDefaultStyles(data.loginPageSettings);
            }
        }

    } catch (error) {
        console.error('[Campaign Loader] Falha ao carregar ou aplicar a campanha:', error);
        // Em caso de erro, a página simplesmente mantém o seu estilo original.
    }
}

/**
 * Aplica os estilos e banners da campanha na página.
 * @param {object} campaignData - O objeto JSON completo da API.
 * @param {boolean} isPreview - Indica se está em modo de pré-visualização.
 */
function applyCampaign(campaignData, isPreview = false) {
    const { preLoginBanner, postLoginBanners, loginPageSettings, template } = campaignData;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Identifica a página atual

    // 1. Aplica as configurações de aparência, priorizando o template sobre as configurações gerais.
    const stylesToApply = {
        login_background_color: template.backgroundUrl ? null : (template.primaryColor || loginPageSettings.login_background_color),
        login_form_background_color: loginPageSettings.login_form_background_color, // Mantém o padrão por enquanto
        login_font_color: template.fontColor || loginPageSettings.login_font_color,
        login_button_color: template.primaryColor || loginPageSettings.login_button_color,
    };
    applyDefaultStyles(stylesToApply);

    // Aplica o tamanho da fonte do template, se definido
    if (template.fontSize) {
        document.documentElement.style.setProperty('--base-font-size', template.fontSize);
    }

    // Aplica a imagem de fundo do template, se definida
    if (template.backgroundUrl) {
        document.body.style.backgroundImage = `url(${template.backgroundUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }

    // Aplica o logótipo do template, se definido
    if (template.logoUrl) {
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            const logoElement = document.createElement('img');
            logoElement.src = template.logoUrl;
            logoElement.alt = "Logótipo da Campanha";
            logoElement.style.cssText = "max-width: 150px; margin-bottom: 1rem;";
            formHeader.prepend(logoElement); // Adiciona o logo no início do cabeçalho
        }
    }

    // 2. Lógica de renderização de banners baseada na página
    // [ALTERADO] Em modo de pré-visualização, mostramos tudo na página de login.
    if (currentPage.includes('index.html') || currentPage.includes('login.html')) {
        console.log('[Campaign Loader] Página de Login detectada. A aplicar todos os banners.');
        // Na página de login, renderiza banners pré-login.
        renderBanner(preLoginBanner, 'pre-login-banner-container', 'Campanha Promocional');
        // Se for pré-visualização, também mostramos os banners pós-login para facilitar.
        if (isPreview) {
            renderBanners(postLoginBanners, 'post-login-banner-container', 'Oferta Especial');
        }

    } else if (currentPage.includes('register.html')) {
        console.log('[Campaign Loader] Página de Registo detectada. A aplicar apenas estilos, sem banners.');
        // Na página de registo, não fazemos nada com os banners, apenas os estilos já foram aplicados.
    }
    // A página status.html não será afetada pois vamos remover o script dela.

    // 3. [NOVO] Lida com os diferentes tipos de formulário de login/registo
    // Esta lógica está preparada para o futuro, sem quebrar o fluxo atual.
    handleLoginType(template?.loginType);
}

/**
 * Renderiza um único banner num container específico.
 * @param {object} banner - O objeto do banner.
 * @param {string} containerId - O ID do elemento HTML onde o banner será inserido.
 * @param {string} altText - O texto alternativo para a imagem.
 */
function renderBanner(banner, containerId, altText) {
    if (!banner || !banner.imageUrl) return;

    const container = document.getElementById(containerId);
    if (container) {
        const fullImageUrl = `${window.API_BASE_URL}${banner.imageUrl}`;
        let bannerHTML = `<img src="${fullImageUrl}" alt="${altText}" style="width: 100%; height: auto; border-radius: 8px;">`;
        if (banner.targetUrl) {
            bannerHTML = `<a href="${banner.targetUrl}" target="_blank">${bannerHTML}</a>`;
        }
        container.innerHTML = bannerHTML;
        container.style.display = 'block';
        console.log(`[Campaign Loader] Banner aplicado em #${containerId}: ${fullImageUrl}`);
    }
}

/**
 * Renderiza uma lista de banners num container.
 * @param {Array<object>} banners - Array de objetos de banner.
 * @param {string} containerId - O ID do elemento HTML.
 * @param {string} altText - O texto alternativo para as imagens.
 */
function renderBanners(banners, containerId, altText) {
    if (!banners || banners.length === 0) return;

    const container = document.getElementById(containerId);
    if (container) {
        let allBannersHTML = '';
        banners.forEach(banner => {
            const fullImageUrl = `${window.API_BASE_URL}${banner.imageUrl}`;
            let bannerHTML = `<img src="${fullImageUrl}" alt="${altText}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;">`;
            if (banner.targetUrl) {
                bannerHTML = `<a href="${banner.targetUrl}" target="_blank">${bannerHTML}</a>`;
            }
            allBannersHTML += bannerHTML;
        });
        container.innerHTML = allBannersHTML;
        container.style.display = 'block';
        console.log(`[Campaign Loader] ${banners.length} banner(s) aplicados em #${containerId}.`);
    }
}

/**
 * [NOVO] Prepara a página para diferentes tipos de formulário.
 * Por agora, apenas prepara o terreno para a Fase 6, sem alterar o comportamento atual.
 * @param {string} loginType - O tipo de login vindo da API (ex: 'padrao', 'simplificado').
 */
function handleLoginType(loginType) {
    if (!loginType) return;

    const formContainer = document.querySelector('.form-container');
    if (!formContainer) return;

    console.log(`[Campaign Loader] Tipo de login recebido: ${loginType}`);

    switch (loginType) {
        case 'padrao':
        case 'cadastro_completo':
            // Para os tipos atuais, não fazemos nada. A página HTML existente é usada.
            console.log('[Campaign Loader] Usando formulário HTML existente.');
            break;

        case 'simplificado':
        case 'validacao_sms':
            // Para os tipos futuros, escondemos o formulário atual e mostramos uma mensagem.
            // Isto é um placeholder para a implementação da Fase 6.
            formContainer.innerHTML = `
                <div class="form-header">
                    <h1>Funcionalidade em Breve</h1>
                    <p>O tipo de login '${loginType}' será implementado em breve.</p>
                </div>`;
            console.log(`[Campaign Loader] Formulário padrão escondido. Placeholder para '${loginType}' exibido.`);
            break;
    }
}

/**
 * Busca e aplica apenas os estilos padrão da API, usado quando não há campanha.
 */
async function applyDefaultStylesFromApi() {
    try {
        // A validação deve ocorrer antes da chamada à API.
        if (typeof window.API_BASE_URL === 'undefined' || !window.API_BASE_URL) {
            // Não tenta buscar se a URL não estiver definida
            return;
        }
        const response = await fetch(`${window.API_BASE_URL}/api/settings/general`);
        if (!response.ok) return;
        const settings = await response.json();
        applyDefaultStyles(settings);
    } catch (error) {
        console.error('[Campaign Loader] Falha ao buscar estilos padrão:', error);
    }
}

/**
 * Aplica estilos visuais com base nas configurações do sistema.
 * @param {object} settings - O objeto loginPageSettings ou de configurações gerais.
 */
function applyDefaultStyles(settings) {
    const root = document.documentElement;
    if (settings.login_background_color) {
        root.style.setProperty('--login-bg-color', settings.login_background_color);
    }
    if (settings.login_form_background_color) {
        root.style.setProperty('--login-form-bg-color', settings.login_form_background_color);
    }
    if (settings.login_font_color) {
        root.style.setProperty('--login-font-color', settings.login_font_color);
    }
    if (settings.login_button_color) {
        root.style.setProperty('--login-button-color', settings.login_button_color);
    }
    console.log('[Campaign Loader] Estilos da página de login aplicados.');
}
