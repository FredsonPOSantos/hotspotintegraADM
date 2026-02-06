// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // A função getUrlParameter está no utils.js, que já é carregado pelo success.ejs.

    const sessionTimer = document.getElementById('session-timer');
    const logoutButton = document.getElementById('logoutButton');

    // --- LÓGICA DO CONTADOR DE TEMPO ---
    // O tempo de sessão real é controlado pelo RADIUS. Este timer é apenas visual.
    let timeLeft = 1800; // 30 minutos em segundos (30 * 60)

    if (sessionTimer) {
        const timerInterval = setInterval(() => {
            timeLeft--;

            const minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;

            if (seconds < 10) {
                seconds = '0' + seconds;
            }

            sessionTimer.textContent = `${minutes}:${seconds}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                sessionTimer.textContent = "Sessão expirada";
                if (logoutButton) logoutButton.textContent = "Reconectar";
            }
        }, 1000);
    }

    // --- LÓGICA DO BOTÃO DE LOGOUT ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // O ideal é redirecionar para o link de logout do MikroTik, se disponível.
            const linkLogout = getUrlParameter('link-logout');
            if (linkLogout) {
                window.location.href = linkLogout;
            } else {
                // Fallback: redireciona para a página de login, mantendo os parâmetros da URL.
                const searchParams = window.location.search;
                window.location.href = 'index.html' + searchParams;
            }
        });
    }
});
