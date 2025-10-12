// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- NOVA LÓGICA: CARREGAMENTO DINÂMICO DO TEMA DO PORTAL ---

    const API_BASE_URL = 'http://10.0.0.46:3000';

    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');
        console.log(`[DIAGNÓSTICO] A iniciar carregamento do tema para o router: ${routerName}`);

        if (!routerName) {
            console.error('[DIAGNÓSTICO] Parâmetro routerName não encontrado no URL. A parar.');
            return;
        }

        try {
            console.log(`[DIAGNÓSTICO] A contactar a API: ${API_BASE_URL}/api/portal?routerName=${routerName}`);
            const response = await fetch(`${API_BASE_URL}/api/portal?routerName=${routerName}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Não foi possível carregar os dados de personalização.');
            }
            const templateData = await response.json();
            console.log('[DIAGNÓSTICO] Dados recebidos da API:', templateData);
            applyTheme(templateData);

        } catch (error) {
            console.error('[DIAGNÓSTICO] Erro ao buscar o tema do portal:', error);
        }
    };

    const applyTheme = (data) => {
        console.log('[DIAGNÓSTICO] A aplicar o tema na página...');
        if (data.login_background_url) {
            document.body.style.backgroundImage = `url('${data.login_background_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            console.log(`[DIAGNÓSTICO] Imagem de fundo aplicada: ${data.login_background_url}`);
        }
        
        const logoContainer = document.getElementById('logo-container');
        if (data.logo_url && logoContainer) {
            logoContainer.innerHTML = `<img src="${data.logo_url}" alt="Logótipo do Portal" style="max-width: 150px; height: auto;">`;
            console.log(`[DIAGNÓSTICO] Logótipo aplicado: ${data.logo_url}`);
        }

        if (data.primary_color) {
            const mainButton = document.querySelector('.btn');
            if (mainButton) {
                console.log('[DIAGNÓSTICO] Elemento .btn encontrado.');
                // Força a remoção do gradiente e aplica a nova cor
                mainButton.style.background = data.primary_color;
                console.log(`[DIAGNÓSTICO] Cor primária aplicada ao botão: ${data.primary_color}`);
            } else {
                console.error('[DIAGNÓSTICO] Elemento .btn não foi encontrado na página.');
            }
        }
        
        if (data.font_size) {
             document.documentElement.style.fontSize = data.font_size;
             console.log(`[DIAGNÓSTICO] Tamanho da fonte aplicado: ${data.font_size}`);
        }
        console.log('[DIAGNÓSTICO] Aplicação do tema concluída.');
    };

    loadPortalTheme();


    // --- LÓGICA ORIGINAL DO SEU FICHEIRO (sem alterações) ---
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (event) => {
            event.preventDefault();
            const searchParams = window.location.search;
            window.location.href = 'register.html' + searchParams;
        });
    }

    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitButton = loginForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'A autenticar...';
        const email = document.getElementById('email').value;
        const password = document.getElementById('senha').value;
        const linkLoginOnly = getUrlParameter('link-login-only');
        if (!linkLoginOnly) {
            displayMessage('Erro: URL de login do hotspot não encontrado.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            return;
        }
        const hotspotLoginForm = document.createElement('form');
        hotspotLoginForm.method = 'post';
        hotspotLoginForm.action = linkLoginOnly;
        hotspotLoginForm.innerHTML = `
            <input type="hidden" name="username" value="${email}">
            <input type="hidden" name="password" value="${password}">
        `;
        document.body.appendChild(hotspotLoginForm);
        hotspotLoginForm.submit();
    });

    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
    const errorMessage = getUrlParameter('error');
    if (errorMessage) {
        displayMessage('Login falhou: ' + errorMessage, 'error');
    }
});

