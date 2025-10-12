// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://10.0.0.46:3000';

    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');
        if (!routerName) {
            console.error('Parâmetro routerName não encontrado.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/portal?routerName=${routerName}`);
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados de personalização.');
            }
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
        // Aplica estilos do template (fundo, logo, cores, fontes)
        if (data.login_background_url) {
            document.body.style.backgroundImage = `url('${data.login_background_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        }
        const logoContainer = document.getElementById('logo-container');
        if (data.logo_url && logoContainer) {
            logoContainer.innerHTML = `<img src="${data.logo_url}" alt="Logótipo do Portal">`;
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
        
        // --- NOVA LÓGICA PARA EXIBIR O BANNER ---
        if (data.banner_image_url) {
            showPreloginBanner(
                data.banner_image_url,
                data.banner_target_url,
                data.banner_display_time
            );
        }
    };
    
    // --- NOVA FUNÇÃO PARA GERIR O BANNER ---
    const showPreloginBanner = (imageUrl, targetUrl, displayTime) => {
        const bannerContainer = document.getElementById('prelogin-banner-container');
        if (!bannerContainer) return;

        const timeInSeconds = parseInt(displayTime, 10) || 5; // Padrão de 5 segundos
        let countdown = timeInSeconds;

        // Cria a estrutura HTML do banner
        bannerContainer.innerHTML = `
            <div class="banner-overlay">
                <div class="banner-modal">
                    <button class="banner-close-btn">&times;</button>
                    <a href="${targetUrl || '#'}" target="_blank">
                        <img src="${imageUrl}" alt="Banner Promocional">
                    </a>
                    <div class="banner-countdown">A fechar em ${countdown}s...</div>
                </div>
            </div>
        `;

        const overlay = bannerContainer.querySelector('.banner-overlay');
        const closeBtn = bannerContainer.querySelector('.banner-close-btn');
        const countdownDiv = bannerContainer.querySelector('.banner-countdown');

        // Função para fechar o banner
        const closeBanner = () => {
            if (overlay) {
                overlay.classList.add('hidden');
            }
            clearInterval(countdownInterval);
        };

        // Evento de clique no botão de fechar
        closeBtn.addEventListener('click', closeBanner);

        // Contagem decrescente
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownDiv) {
                countdownDiv.textContent = `A fechar em ${countdown}s...`;
            }
            if (countdown <= 0) {
                closeBanner();
            }
        }, 1000);
    };

    loadPortalTheme();


    // --- LÓGICA ORIGINAL DO SEU FICHEIRO (sem alterações) ---
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'register.html' + window.location.search;
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

