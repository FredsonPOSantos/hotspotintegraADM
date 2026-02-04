module.exports = {
  apps: [
    {
      name: "hotspot-portal",
      script: "./backend/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // [CORRIGIDO] IP do servidor onde o painel de ADMINISTRAÇÃO (que serve as imagens) está a ser executado.
        // Não use '127.0.0.1' ou 'localhost' em produção.
        ADM_SERVER_IP: "10.0.0.45",
      }
    }
  ]
};