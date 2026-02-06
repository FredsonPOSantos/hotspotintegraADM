/**
 * @desc    Busca o valor de um parâmetro específico na URL.
 * @param   {string} name - O nome do parâmetro a ser buscado (ex: 'mac').
 * @returns {string|null} - Retorna o valor do parâmetro ou null se não for encontrado.
 */
function getUrlParameter(name) {
    // Adiciona uma camada extra de segurança, escapando caracteres especiais
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    // Cria uma expressão regular para encontrar o parâmetro na URL
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    // Executa a expressão regular na URL da janela atual
    const results = regex.exec(location.search);
    // Retorna o resultado decodificado ou null
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * [NOVO] Realiza uma requisição padronizada para a API do servidor de Administração.
 * Centraliza a lógica de chamadas 'fetch' para reutilização e manutenção mais fácil.
 * @param {string} endpoint O endpoint da API (ex: '/api/auth/register').
 * @param {string} method O método HTTP (geralmente 'POST').
 * @param {object|null} body O corpo da requisição.
 * @returns {Promise<object>} A resposta da API em formato JSON.
 */
async function apiRequest(endpoint, method = 'POST', body = null) {
    // A variável global window.API_BASE_URL é injetada pelo template EJS no servidor.
    if (typeof window.API_BASE_URL === 'undefined' || !window.API_BASE_URL) {
        throw new Error('Erro de configuração: A URL da API não foi definida.');
    }

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        // Lança um erro com a mensagem vinda da API, se houver.
        throw new Error(data.message || `Erro na comunicação com o servidor (Status: ${response.status})`);
    }

    return data;
}
