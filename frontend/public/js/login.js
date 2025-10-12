// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- NOVA LÓGICA: CARREGAMENTO DINÂMICO DO TEMA DO PORTAL ---

    // Função assíncrona para buscar e aplicar o tema do portal
    const loadPortalTheme = async () => {
        const routerName = getUrlParameter('routerName');

        // Se não houver nome do roteador no URL, não faz nada
        if (!routerName) {
            console.error('Parâmetro routerName não encontrado no URL.');
            // Podemos definir um tema padrão aqui se quisermos
            return;
        }

        try {
            // Chama a nova API para obter os dados do template
            const response = await fetch(`/api/portal?routerName=${routerName}`);
            
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados de personalização do portal.');
            }

            const templateData = await response.json();
            applyTheme(templateData);

        } catch (error) {
            console.error('Erro ao buscar o tema do portal:', error);
            // Poderíamos exibir uma mensagem de erro para o utilizador aqui
        }
    };

    // Função para aplicar os dados do template à página HTML
    const applyTheme = (data) => {
        // Aplica a cor de fundo ou imagem de fundo ao corpo da página
        if (data.login_background_url) {
            document.body.style.backgroundImage = `url('${data.login_background_url}')`;
            // Adicione outras propriedades de fundo se necessário, como:
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        }

        // Insere o logótipo no seu container
        const logoContainer = document.getElementById('logo-container');
        if (data.logo_url && logoContainer) {
            logoContainer.innerHTML = `<img src="${data.logo_url}" alt="Logótipo do Portal" style="max-width: 150px; height: auto;">`;
        }

        // Define a cor primária usando uma variável CSS para maior flexibilidade
        if (data.primary_color) {
            document.documentElement.style.setProperty('--primary-color', data.primary_color);
        }
        
        // Define o tamanho da fonte principal se especificado
        if (data.font_size) {
             document.documentElement.style.setProperty('--base-font-size', data.font_size);
        }
    };

    // Inicia o carregamento do tema assim que a página estiver pronta
    loadPortalTheme();


    // --- LÓGICA ORIGINAL (com pequenas melhorias) ---

    // Mantém os parâmetros do URL ao clicar no link de registo
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (event) => {
            event.preventDefault(); // Previne a navegação imediata
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
        
        // Captura o URL especial que o MikroTik nos fornece para o login
        const linkLoginOnly = getUrlParameter('link-login-only');
        if (!linkLoginOnly) {
            displayMessage('Erro: URL de login do hotspot não encontrado.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            return;
        }

        // Cria um formulário "fantasma" na memória para submeter os dados para o MikroTik
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

