// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- NOVA LÓGICA: CARREGAMENTO DINÂMICO DO TEMA DO PORTAL ---

    // Define o endereço base da sua API de backend
    const API_BASE_URL = 'http://10.0.0.46:3000'; // <-- ALTERAÇÃO CRUCIAL

    // Função assíncrona para buscar e aplicar o tema do portal
    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');

        if (!routerName) {
            console.error('Parâmetro routerName não encontrado no URL.');
            return;
        }

        try {
            // Chama a nova API usando o endereço completo
            const response = await fetch(`${API_BASE_URL}/api/portal?routerName=${routerName}`);
            
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados de personalização do portal.');
            }

            const templateData = await response.json();
            applyTheme(templateData);

        } catch (error) {
            console.error('Erro ao buscar o tema do portal:', error);
        }
    };

    // Função para aplicar os dados do template à página HTML
    const applyTheme = (data) => {
        if (data.login_background_url) {
            document.body.style.backgroundImage = `url('${data.login_background_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        }
        const logoContainer = document.getElementById('logo-container');
        if (data.logo_url && logoContainer) {
            logoContainer.innerHTML = `<img src="${data.logo_url}" alt="Logótipo do Portal" style="max-width: 150px; height: auto;">`;
        }
        if (data.primary_color) {
            document.documentElement.style.setProperty('--primary-color', data.primary_color);
        }
        if (data.font_size) {
             document.documentElement.style.setProperty('--base-font-size', data.font_size);
        }
    };

    loadPortalTheme();


    // --- LÓGICA ORIGINAL (sem alterações) ---
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

