module.exports = {
  apps: [
    {
      name: "hotspot-portal",
      script: "./backend/server.js",
      // [MELHORIA] 'max' utiliza todos os núcleos de CPU disponíveis,
      // melhorando a performance sob alta carga de acessos. '1' também funciona perfeitamente.
      instances: "max",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,

        // --- Conexão com o Servidor Administrador (10.0.0.47) ---
        // IP do servidor que gere campanhas e registo de utilizadores.
        // Não use '127.0.0.1' ou 'localhost' em produção.
        ADM_SERVER_IP: "10.0.0.47",
        ADM_SERVER_PORT: 3000, // Porta padrão do painel de administração

        // --- Conexão com o Servidor de Serviços (10.0.0.45) ---
        // Usando os nomes de variáveis que a sua aplicação espera (DB_*),
        // conforme o seu ficheiro .env.
        DB_HOST: "10.0.0.45",
        DB_USER: "radius",
        DB_PASSWORD: "Rota1010",
        DB_DATABASE: "radius",
        DB_PORT: 5432
      }
    }
  ]
};