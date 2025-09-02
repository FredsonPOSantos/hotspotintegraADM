** Sistema funcional. 
** Salva Nome do router (hotspot).
** Salva Data cadastro.
** salva ultimo login.
** tempo de 30 minutos.
** cadastro e login simples.
**sem implementação de banners pre e pos login, sem logo, sem videos, sem designer, mongo db online.

Rota Hotspot - Sistema de Gestão de Acesso
📖 Descrição
O Rota Hotspot é um portal cativo completo para routers MikroTik, desenvolvido para oferecer uma experiência de utilizador moderna e uma gestão centralizada. A aplicação permite que utilizadores se registem e façam login para aceder à rede, com todas as informações a serem armazenadas de forma segura numa base de dados MongoDB Atlas.

O sistema foi desenhado para ser robusto e escalável, controlando o tempo de acesso dos utilizadores diretamente através da API do MikroTik e dos perfis de utilizador, garantindo uma desconexão automática e forçando um novo login para manter os registos de atividade atualizados.

✨ Funcionalidades Principais
Registo de Utilizadores: Formulário de registo completo (nome, e-mail, telefone, senha).

Autenticação Segura: Login com validação de credenciais e senhas criptografadas.

Captura Automática de Dados: O sistema captura automaticamente o endereço MAC e o nome do roteador no momento do acesso.

Controlo de Sessão por Tempo: Utiliza os perfis de utilizador do MikroTik para criar sessões com tempo de expiração definido (ex: 30 minutos), forçando uma nova autenticação após o término.

Base de Dados na Nuvem: Armazena todos os dados dos utilizadores no MongoDB Atlas, permitindo uma gestão centralizada e segura.

Registo de Atividade: Guarda a data de registo e atualiza a data do último login a cada nova sessão.

🚀 Tecnologias Utilizadas
Backend: Node.js, Express.js

Base de Dados: MongoDB com Mongoose

Autenticação: JWT (JSON Web Tokens), bcrypt.js

Comunicação com o Router: node-routeros (API do MikroTik)

Frontend: HTML5, CSS3, JavaScript (Vanilla)

Hardware: Router MikroTik com RouterOS

🔧 Como Instalar e Executar
Para instruções detalhadas sobre como configurar o ambiente, instalar as dependências e executar o sistema completo (Backend, Frontend e MikroTik), por favor, consulte o nosso Guia de Instalação e Execução.