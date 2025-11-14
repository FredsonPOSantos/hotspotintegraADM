** Sistema funcional. 
** Salva Nome do router (hotspot).
** Salva Data cadastro.
** salva ultimo login.
** tempo de 30 minutos.
** cadastro e login simples.
**sem implementação de banners pre e pos login, sem logo, sem videos, sem designer, postgresql, freeradius

RotaHotspot v2 - Sistema de Gestão de Acesso via RADIUS
📖 Descrição
O RotaHotspot é um portal cativo de nível profissional para routers MikroTik, redesenhado para utilizar uma arquitetura AAA (Authentication, Authorization, and Accounting) padrão da indústria com FreeRADIUS.

Esta versão abandona a comunicação direta via API em favor de um sistema mais seguro, escalável e centralizado, onde o MikroTik consulta um servidor FreeRADIUS para autenticar utilizadores. A aplicação Node.js agora atua como um portal de registo, populando uma base de dados PostgreSQL que serve como a fonte de verdade para o FreeRADIUS.

✨ Funcionalidades Principais
Registo de Utilizadores: Portal de registo moderno (nome, e-mail, telefone, senha) que alimenta diretamente a base de dados de autenticação.

Autenticação Centralizada via RADIUS: O login é gerido pelo FreeRADIUS, garantindo compatibilidade e segurança de nível empresarial. As senhas são guardadas na base de dados com criptografia bcrypt.

Captura Automática de Dados: O sistema captura e armazena o endereço MAC do utilizador e o nome do roteador no momento do registo.

Controlo de Sessão por Tempo: Utiliza os perfis de utilizador do FreeRADIUS e do MikroTik para criar sessões com tempo de expiração definido (ex: 30 minutos), forçando uma nova autenticação de forma fiável.

Base de Dados Robusta: Armazena todos os dados dos utilizadores numa base de dados PostgreSQL local, oferecendo desempenho e fiabilidade.

Registo de Atividade: Guarda a data de registo e atualiza a data do último login a cada nova sessão autenticada pelo FreeRADIUS.

🚀 Arquitetura e Tecnologias
Portal de Registo (Backend): Node.js, Express.js

Base de Dados: PostgreSQL

Servidor de Autenticação: FreeRADIUS 3.0 (a correr no Ubuntu via WSL 2)

Criptografia de Senha: bcrypt.js

Portal de Registo (Frontend): HTML5, CSS3, JavaScript (Vanilla)

Hardware: Router MikroTik com RouterOS

Ambiente de Servidor: Windows com WSL 2 (Modo Espelhado)

🔧 Como Instalar e Executar
Para instruções detalhadas sobre como configurar o ambiente completo, desde o Windows e WSL até ao PostgreSQL, FreeRADIUS, Node.js e MikroTik, por favor, consulte o nosso guia_definitivo_rotahotspot.md.

Rota Hotspot - Sistema de Gestão de Acesso
📖 Descrição
O Rota Hotspot é um portal cativo completo para routers MikroTik, desenvolvido para oferecer uma experiência de utilizador moderna e uma gestão centralizada. A aplicação permite que utilizadores se registem e façam login para aceder à rede, com todas as informações a serem armazenadas de forma segura numa base de dados MongoDB Atlas.

O sistema foi desenhado para ser robusto e escalável, controlando o tempo de acesso dos utilizadores diretamente através da API do MikroTik e dos perfis de utilizador, garantindo uma desconexão automática e forçando um novo login para manter os registos de atividade atualizados.

✨ Funcionalidades Principais
Registo de Utilizadores: Formulário de registo completo (nome, e-mail, telefone, senha).

Autenticação Segura: Login com validação de credenciais e senhas criptografadas.

Captura Automática de Dados: O sistema captura automaticamente o endereço MAC e o nome do roteador no momento do acesso.

Controlo de Sessão por Tempo: Utiliza os perfis de utilizador do MikroTik para criar sessões com tempo de expiração definido (ex: 30 minutos), forçando uma nova autenticação após o término.


Registo de Atividade: Guarda a data de registo e atualiza a data do último login a cada nova sessão.

🚀 Tecnologias Utilizadas
Backend: Node.js, Express.js

Autenticação: JWT (JSON Web Tokens), bcrypt.js

Frontend: HTML5, CSS3, JavaScript (Vanilla)

Hardware: Router MikroTik com RouterOS

