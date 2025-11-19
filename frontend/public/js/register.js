// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA MANTER OS PARÂMETROS NA NAVEGAÇÃO ---
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            const searchParams = window.location.search;
            window.location.href = 'index.html' + searchParams;
        });
    }

    // --- NOVA LÓGICA DE VALIDAÇÃO DE SENHA ---
    const passwordInput = document.getElementById('senha');
    const lengthCheck = document.getElementById('length-check');
    const termsCheckbox = document.getElementById('termsCheckbox'); // [NOVO]
    const submitButton = document.getElementById('submitButton');

    // [NOVO] Função para validar o formulário e ativar/desativar o botão
    const validateForm = () => {
        const password = passwordInput.value;
        const termsAccepted = termsCheckbox.checked;
        let isPasswordValid = false;

        // 1. Verifica o comprimento da senha
        if (password.length >= 6) {
            lengthCheck.className = 'valid'; // Muda a cor para verde
            isPasswordValid = true;
        } else {
            lengthCheck.className = 'invalid'; // Mantém a cor vermelha
            isPasswordValid = false;
        }

        // 2. Ativa o botão apenas se a senha for válida E os termos forem aceites
        if (isPasswordValid && termsAccepted) {
            submitButton.disabled = false; // Ativa o botão
        } else {
            submitButton.disabled = true; // Desativa o botão
        }
    };

    // Adiciona "ouvintes" para validar o formulário em tempo real
    passwordInput.addEventListener('input', validateForm);
    termsCheckbox.addEventListener('input', validateForm);
    // --- FIM DA NOVA LÓGICA ---

    // Seleciona os elementos do formulário e da mensagem
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Adiciona um "ouvinte" para o evento de submissão do formulário
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Limpa mensagens anteriores e desativa o botão para evitar cliques duplos
        messageDiv.textContent = '';
        messageDiv.className = 'message';
        submitButton.disabled = true;
        submitButton.textContent = 'Aguarde...';

        // Captura os valores dos campos do formulário
        const nomeCompleto = document.getElementById('nomeCompleto').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const senha = passwordInput.value; // Usa a referência que já temos
        const acceptsMarketing = document.getElementById('marketingCheckbox').checked; // [NOVO]
        
        // Captura o endereço MAC e o NOME DO ROTEADOR da URL
        const mac = getUrlParameter('mac');
        const routerName = getUrlParameter('routerName');

        // Validação para garantir que os dados essenciais do hotspot foram recebidos
        if (!mac || !routerName) {
            displayMessage('Dados do hotspot inválidos. Por favor, reconecte-se à rede.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            return;
        }

        // Monta o corpo da requisição com os dados a serem enviados para o backend
        const userData = {
            nomeCompleto,
            email,
            telefone,
            senha,
            mac,
            routerName,
            accepts_marketing: acceptsMarketing, // [NOVO]
            terms_accepted: termsCheckbox.checked // [NOVO]
        };

        try {
            // Envia a requisição para a API de registo no servidor ADM.
            // A variável global API_BASE_URL é definida diretamente no template .ejs
            // antes de este script ser carregado.
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            // Converte a resposta da API para JSON
            const data = await response.json();

            // Verifica se a requisição foi bem-sucedida
            if (response.ok) {
                displayMessage(data.message || 'Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
                // Aguarda 2 segundos e redireciona o usuário para a página de login, mantendo os parâmetros da URL
                setTimeout(() => {
                    window.location.href = 'index.html' + location.search;
                }, 2000);
            } else {
                // Se houve um erro, exibe a mensagem retornada pela API
                throw new Error(data.message || 'Ocorreu um erro no cadastro.');
            }
        } catch (error) {
            // Em caso de erro na comunicação com a API, exibe uma mensagem genérica
            displayMessage(error.message, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
        }
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
});
