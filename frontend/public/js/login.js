// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA MANTER OS PARÂMETROS NA NAVEGAÇÃO ---
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        // Adiciona um "ouvinte" ao clique no link para construir o URL de registo dinamicamente
        registerLink.addEventListener('click', (event) => {
            event.preventDefault();
            const searchParams = window.location.search;
            window.location.href = 'register.html' + searchParams;
        });
    }

    // Seleciona os elementos do formulário e da mensagem
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    // Adiciona um "ouvinte" para o evento de submissão do formulário
    loginForm.addEventListener('submit', (event) => {
        // Previne o comportamento padrão do formulário
        event.preventDefault();

        // Desativa o botão para evitar cliques duplos
        const submitButton = loginForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'A autenticar...';

        // Captura os valores que o utilizador digitou
        const email = document.getElementById('email').value;
        const password = document.getElementById('senha').value;
        
        // Captura o URL de login especial que o MikroTik nos forneceu
        const linkLoginOnly = getUrlParameter('link-login-only');

        // Validação crucial: se não tivermos este URL, a autenticação falhará
        if (!linkLoginOnly) {
            displayMessage('URL de autenticação do hotspot não encontrado. Acesso inválido.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            return;
        }

        // Cria um novo formulário "fantasma" na memória
        const hotspotLoginForm = document.createElement('form');
        hotspotLoginForm.method = 'post';
        hotspotLoginForm.action = linkLoginOnly; // A ação do formulário é o URL do MikroTik
        
        // Adiciona o e-mail (como 'username') e a senha como campos escondidos
        hotspotLoginForm.innerHTML = `
            <input type="hidden" name="username" value="${email}">
            <input type="hidden" name="password" value="${password}">
        `;

        // Adiciona o formulário à página e submete-o.
        // O navegador irá agora enviar os dados diretamente para o MikroTik.
        document.body.appendChild(hotspotLoginForm);
        hotspotLoginForm.submit();
    });

    /**
     * @desc    Exibe uma mensagem de feedback para o usuário.
     * @param   {string} text - O texto da mensagem.
     * @param   {string} type - O tipo da mensagem ('success' ou 'error').
     */
    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }

    // Verifica se a página carregou com uma mensagem de erro do MikroTik
    const errorMessage = getUrlParameter('error');
    if (errorMessage) {
        displayMessage('Login falhou: ' + errorMessage, 'error');
    }
});

