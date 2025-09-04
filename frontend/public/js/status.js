// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Função para ler parâmetros da URL (reutilizada do utils.js)
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Seleciona os elementos na página
    const welcomeMessage = document.getElementById('welcomeMessage');
    const sessionTimer = document.getElementById('session-timer');
    const logoutButton = document.getElementById('logoutButton');

    // Captura o nome do utilizador a partir dos parâmetros da URL
    const userName = getUrlParameter('name');

    // Se o nome do utilizador existir, personaliza a mensagem de boas-vindas
    if (userName) {
        welcomeMessage.textContent = `Bem-vindo a uma nova experiência, ${userName}!`;
    }

    // --- LÓGICA DO CONTADOR DE TEMPO ---
    let timeLeft = 1800; // 30 minutos em segundos (30 * 60)

    // Inicia um intervalo que é executado a cada segundo
    const timerInterval = setInterval(() => {
        // Reduz o tempo restante em 1 segundo
        timeLeft--;

        // Calcula os minutos e segundos
        const minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        // Formata os segundos para ter sempre dois dígitos (ex: 09, 08, etc.)
        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        // Atualiza o texto do contador no ecrã
        sessionTimer.textContent = `${minutes}:${seconds}`;

        // Se o tempo acabar, para o contador
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            sessionTimer.textContent = "Sessão expirada";
            logoutButton.textContent = "Reconectar";
        }
    }, 1000); // 1000 milissegundos = 1 segundo

    // --- LÓGICA DO BOTÃO DE LOGOUT ---
    logoutButton.addEventListener('click', () => {
        // Por agora, o logout simplesmente redireciona para a página de login
        // No futuro, podemos adicionar uma chamada à API para invalidar a sessão
        
        // Pega todos os parâmetros da URL para os passar para a página de login
        const searchParams = window.location.search;
        window.location.href = 'index.html' + searchParams;
    });

});
