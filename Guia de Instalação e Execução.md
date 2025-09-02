Guia de Instalação e Execução - Rota Hotspot
Este guia detalha todos os passos necessários para configurar e executar o sistema Rota Hotspot num novo ambiente, seja para desenvolvimento ou produção local.

1. Pré-requisitos
Antes de começar, garanta que tem os seguintes softwares instalados no seu computador/servidor:

Node.js: (Versão 16 ou superior)

NPM: (Geralmente vem instalado com o Node.js)

Git: Para clonar o repositório.

Um router MikroTik: Acessível na rede local.

Conta no MongoDB Atlas: Para a base de dados na nuvem.

2. Configuração do Backend (Servidor)
O backend é o cérebro do sistema. Siga estes passos para o configurar:

Clonar o Repositório:
Abra um terminal e clone o projeto a partir do GitHub.

git clone [URL_DO_SEU_REPOSITORIO_GIT]
cd Rota_Hotspot/backend

Instalar as Dependências:
Dentro da pasta backend, execute o comando para instalar todos os pacotes necessários.

npm install

Criar o Ficheiro de Ambiente (.env):
Crie um ficheiro chamado .env na raiz da pasta backend e copie o conteúdo abaixo para dentro dele. Substitua os valores de exemplo pelos seus dados reais.

# Configurações do MongoDB Atlas
# Substitua pela sua string de ligação
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/suaBaseDeDados?retryWrites=true&w=majority

# Chave secreta para gerar os tokens de autenticação
JWT_SECRET=seuSegredoSuperSecreto123

# Credenciais de acesso à API do MikroTik
MIKROTIK_HOST=192.168.10.1
MIKROTIK_USER=admin
MIKROTIK_PASSWORD=suaSenhaDoMikroTik

Iniciar o Servidor:
Com tudo configurado, inicie o servidor.

node server.js

Se tudo estiver correto, deverá ver as mensagens "Servidor rodando em http://localhost:3000" e "Conexão com o MongoDB estabelecida com sucesso!".

3. Configuração do MikroTik
Esta é a parte mais crítica, que liga o hardware ao nosso software.

Criar o Perfil de Utilizador:
Crie o perfil que irá controlar o tempo de sessão dos utilizadores.

Via WinBox: Vá para IP -> Hotspot -> User Profiles. Crie um novo perfil com:

Name: perfil-30-minutos

Session Timeout: 00:30:00

Via Terminal:
/ip hotspot user profile add name="perfil-30-minutos" session-timeout=30m

Configurar o Walled Garden:
Permita que os utilizadores não autenticados acedam ao seu servidor.

Via WinBox: Vá para IP -> Hotspot -> Walled Garden IP. Crie uma nova regra com:

Action: accept

Dst. Address: 192.168.10.199 (O IP do computador que está a correr o backend)

Via Terminal:
/ip hotspot walled-garden ip add action=accept dst-address=192.168.10.199

Carregar o Ficheiro de Redirecionamento:

Aceda ao ficheiro login.html que criámos (o que apenas redireciona).

Via WinBox: Vá para Files. Apague o login.html existente dentro da pasta hotspot e carregue o nosso ficheiro de redirecionamento para o mesmo local.

4. Configuração do Frontend
Localização dos Ficheiros: Todos os ficheiros do frontend (index.html, register.html, as pastas css/ e js/) devem estar dentro de frontend/public/.

Iniciar o Servidor Frontend:
Para testar localmente, abra um novo terminal, navegue até à pasta frontend e execute:

# (Se ainda não o tiver instalado: npm install -g http-server)
http-server -p 8081

Este servidor irá servir os ficheiros que estão na subpasta public.

5. Executando o Sistema Completo
Garanta que o servidor backend está a correr.

Garanta que o servidor frontend (se estiver a testar) está a correr.

Ligue um dispositivo (ex: telemóvel) à rede Wi-Fi do MikroTik.

O dispositivo deverá ser automaticamente redirecionado para o seu servidor frontend, e o fluxo de registo/login deverá funcionar como esperado.