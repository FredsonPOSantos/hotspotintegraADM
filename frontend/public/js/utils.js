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
