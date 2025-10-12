// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- NOVA LÓGICA: CARREGAMENTO DINÂMICO DO TEMA DO PORTAL ---

    const API_BASE_URL = 'http://10.0.0.46:3000';

    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');
        if (!routerName) {
            console.error('Parâmetro routerName não encontrado no URL.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/portal?routerName=${routerName}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Não foi possível carregar os dados de personalização.');
            }
            const templateData = await response.json();
            applyTheme(templateData);
        } catch (error) {
            console.error('Erro ao buscar o tema do portal:', error);
        }
    };

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

        // --- SOLUÇÃO DEFINITIVA PARA APLICAR A COR ---
        if (data.primary_color) {
            const mainButton = document.querySelector('.btn');
            if (mainButton) {
                // Usa setProperty com '!important' para garantir que o estilo seja aplicado sobre o CSS
                // Primeiro removemos o gradiente e depois aplicamos a cor
                mainButton.style.setProperty('background', 'none', 'important');
                mainButton.style.setProperty('background-color', data.primary_color, 'important');
            }
        }
        
        if (data.font_size) {
             document.documentElement.style.fontSize = data.font_size;
        }
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

