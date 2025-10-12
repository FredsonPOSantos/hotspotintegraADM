// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {

    // --- NOVA LÓGICA: CARREGAMENTO DINÂMICO DO TEMA ---
    const API_BASE_URL = 'http://10.0.0.46:3000';

    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');
        if (!routerName) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/portal?routerName=${routerName}`);
            if (!response.ok) throw new Error('Falha ao carregar o tema.');
            const templateData = await response.json();
            applyTheme(templateData);
        } catch (error) {
            console.error('Erro ao buscar o tema do portal:', error);
        }
    };

    const darkenHexColor = (hex, percent) => {
        if (!hex) return '#000000';
        let r = parseInt(hex.substring(1, 3), 16),
            g = parseInt(hex.substring(3, 5), 16),
            b = parseInt(hex.substring(5, 7), 16);
        r = parseInt(r * (100 - percent) / 100);
        g = parseInt(g * (100 - percent) / 100);
        b = parseInt(b * (100 - percent) / 100);
        const toHex = (c) => ('0' + c.toString(16)).slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
        if (data.primary_color) {
            const darkerColor = darkenHexColor(data.primary_color, 20);
            document.documentElement.style.setProperty('--gradient-start', data.primary_color);
            document.documentElement.style.setProperty('--gradient-end', darkerColor);
        }
        if (data.font_color) {
            document.documentElement.style.setProperty('--font-color', data.font_color);
        }
        if (data.font_size) {
            document.documentElement.style.setProperty('--base-font-size', data.font_size);
        }
    };
    
    // Inicia o carregamento do tema
    loadPortalTheme();


    // --- LÓGICA EXISTENTE (Validação de Senha e Submissão) ---

    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'index.html' + window.location.search;
        });
    }

    const passwordInput = document.getElementById('senha');
    const lengthCheck = document.getElementById('length-check');
    const submitButton = document.getElementById('submitButton');

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        let isLengthValid = password.length >= 6;

        // Atualiza a classe para mudar a cor via CSS (do seu ficheiro original)
        lengthCheck.className = isLengthValid ? 'valid' : 'invalid';
        // A cor real é controlada pelo seu ficheiro style.css
        lengthCheck.style.color = isLengthValid ? 'green' : 'red';
        submitButton.disabled = !isLengthValid;
    });
    
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        submitButton.disabled = true;
        submitButton.textContent = 'A processar...';

        const userData = {
            nomeCompleto: document.getElementById('nomeCompleto').value,
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            telefone: document.getElementById('telefone').value,
            mac: getUrlParameter('mac'),
            routerName: getUrlParameter('routerName')
        };
        
        try {
            // Usa a API_BASE_URL para a chamada de registo
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro no cadastro.');
            }

            displayMessage('Cadastro realizado com sucesso! A redirecionar...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html' + window.location.search;
            }, 2000);

        } catch (error) {
            displayMessage(error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
        }
    });

    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});

