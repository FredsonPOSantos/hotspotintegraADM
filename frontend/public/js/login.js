// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA MANTER OS PARÂMETROS NA NAVEGAÇÃO ---
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
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
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Limpa mensagens anteriores e desativa o botão
        messageDiv.textContent = '';
        messageDiv.className = 'message';
        const submitButton = loginForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'Aguarde...';

        // Captura os valores dos campos do formulário
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        
        // Captura o endereço MAC e o link de login do MikroTik da URL
        const mac = getUrlParameter('mac');
        const linkLoginOnly = getUrlParameter('link-login-only');

        if (!mac) {
            displayMessage('Endereço MAC não encontrado. Acesso inválido.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            return;
        }

        const loginData = { email, senha, mac };

        try {
            const response = await fetch('http://192.168.10.199:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage(data.message || 'Login bem-sucedido! A ligar à rede...', 'success');
                
                // ---- CORREÇÃO CRÍTICA ----
                // Após o sucesso, submete um formulário "fantasma" para o URL de login do MikroTik
                // para ativar a sessão que o nosso backend acabou de criar.
                if (linkLoginOnly) {
                    setTimeout(() => {
                        const hotspotLoginForm = document.createElement('form');
                        hotspotLoginForm.method = 'post';
                        hotspotLoginForm.action = linkLoginOnly; // Usa o link capturado da URL
                        hotspotLoginForm.innerHTML = `
                            <input type="hidden" name="username" value="${mac}">
                            <input type="hidden" name="password" value="${mac}">
                        `;
                        document.body.appendChild(hotspotLoginForm);
                        hotspotLoginForm.submit();
                    }, 1500);
                } else {
                     console.error("DEBUG: 'link-login-only' não encontrado na URL. Não é possível ativar a sessão.");
                     displayMessage('Autorizado, mas falha ao ativar a sessão. Tente novamente.', 'error');
                }

            } else {
                throw new Error(data.message || 'Ocorreu um erro no login.');
            }
        } catch (error) {
            displayMessage(error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    });

    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});

