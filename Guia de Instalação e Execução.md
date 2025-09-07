Guia Definitivo de Implementação: RotaHotspot
Este documento serve como um guia completo para a instalação, configuração e implementação do sistema RotaHotspot, utilizando uma arquitetura moderna e robusta.

Arquitetura Final:

Portal de Registo: Aplicação Node.js com frontend (HTML/CSS/JS).

Base de Dados: Servidor PostgreSQL a correr nativamente no Windows.

Servidor de Autenticação: FreeRADIUS 3.0 a correr no Ubuntu (via WSL 2) no Windows.

Controlador de Rede: Router MikroTik a funcionar como portal cativo (Hotspot).

Fase 1: Configurar o Ambiente Windows e WSL 2
Nesta fase, preparamos o Windows para correr o nosso ambiente Linux de forma otimizada.

Pré-requisitos:

Windows 11 (versão 22H2 ou superior) para garantir a compatibilidade com o modo de rede espelhado do WSL.

Node.js (LTS) instalado no Windows.

Instalar e Configurar o WSL 2:

Abra o PowerShell como Administrador e execute: wsl --install

Reinicie o computador.

Após reiniciar, configure o seu utilizador e senha para o Ubuntu.

Garanta que a versão 2 é o padrão com: wsl --set-default-version 2

Ativar o Modo de Rede Espelhado (Mirrored Mode):

No Explorador de Ficheiros, vá para a sua pasta de utilizador (%userprofile%).

Crie um ficheiro de texto chamado .wslconfig e adicione o seguinte conteúdo:

[wsl2]
networkingMode=mirrored

Reinicie o WSL executando no PowerShell: wsl --shutdown

Fase 2: Instalar e Preparar a Base de Dados (PostgreSQL)
Instale o PostgreSQL no Windows. Lembre-se de guardar a senha do superutilizador postgres.

Prepare a Base de Dados radius usando o SQL Shell (psql):

Ligue-se ao servidor (aceitando os padrões e inserindo a sua senha de postgres).

Execute os seguintes comandos:

CREATE DATABASE radius;
\c radius
CREATE USER radius WITH PASSWORD 'sua_senha_forte_aqui';

-- Copie o schema.sql do WSL para o seu Ambiente de Trabalho antes de executar o próximo comando
-- Comando no Ubuntu: sudo cp /etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql /mnt/c/Users/SeuUsuario/Desktop/
\i 'C:/Users/SeuUsuario/Desktop/schema.sql'

CREATE TABLE userdetails (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    nome_completo VARCHAR(255),
    telefone VARCHAR(20),
    mac_address VARCHAR(17),
    router_name VARCHAR(32),
    data_cadastro TIMESTAMPTZ DEFAULT NOW(),
    ultimo_login TIMESTAMPTZ
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius;

Configure o pg_hba.conf para permitir ligações da sua rede local.

Abra o ficheiro C:\Program Files\PostgreSQL\...\data\pg_hba.conf como Administrador.

Adicione a seguinte linha no final do ficheiro para permitir que o FreeRADIUS (e o seu Node.js) se liguem:

# Permite ligações da rede local (IP do seu servidor/WSL)
host    all             all             192.168.10.0/24         scram-sha-256

Reinicie o serviço do PostgreSQL através de services.msc.

Fase 3: Instalar e Configurar o FreeRADIUS (Ubuntu/WSL)
Instale o FreeRADIUS e o módulo PostgreSQL no seu terminal Ubuntu:

sudo apt update && sudo apt upgrade -y
sudo apt install freeradius freeradius-postgresql -y

Configure o Módulo SQL (mods-available/sql):

Abra o ficheiro: sudo nano /etc/freeradius/3.0/mods-available/sql

Altere o dialect para "postgresql".

Ative o driver correto:

#driver = "rlm_sql_null"
driver = "rlm_sql_${dialect}"

Configure as informações de ligação. Como o WSL está agora na mesma rede, o server é o IP do seu Windows:

server = "192.168.10.199" ou "localhost"
port = 5432
login = "radius"
password = "sua_senha_forte_aqui"
radius_db = "radius"

Ative o Módulo SQL:

sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/

Configure o sites-available/default:

Abra o ficheiro: sudo nano /etc/freeradius/3.0/sites-available/default

Em cada uma das secções (authorize, accounting, session, post-auth), encontre a palavra sql e garanta que ela não tem um # ou - antes.

Configure o clients.conf:

Abra o ficheiro: sudo nano /etc/freeradius/3.0/clients.conf

Adicione o seu MikroTik no final do ficheiro:

client mikrotik {
    ipaddr = 192.168.10.1
    secret = Rota1010
}