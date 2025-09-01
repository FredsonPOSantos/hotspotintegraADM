const { RouterOSAPI } = require('node-routeros');

/**
 * @desc    Autoriza um utilizador no hotspot do MikroTik criando um utilizador temporário.
 * @param   {string} userMac - O endereço MAC do utilizador a ser autorizado.
 * @returns {Promise<boolean>} - Retorna true se a autorização for bem-sucedida.
 * @throws  {Error} - Lança um erro se a autorização falhar.
 */
const authorizeUserInHotspot = async (userMac) => {
    console.log(`Tentando autorizar o MAC ${userMac} com perfil de 30 minutos...`);

    const client = new RouterOSAPI({
        host: process.env.MIKROTIK_HOST,
        user: process.env.MIKROTIK_USER,
        password: process.env.MIKROTIK_PASSWORD,
    });

    try {
        await client.connect();
        console.log(`Conectado ao MikroTik (${process.env.MIKROTIK_HOST}) com sucesso.`);

        // 1. Procura se já existe um utilizador na base de dados do hotspot com este MAC
        const findUserInDbCommand = ['/ip/hotspot/user/print', `?name=${userMac}`];
        const existingUsers = await client.write(findUserInDbCommand);

        // 2. Se já existir um utilizador, remove-o para garantir uma sessão nova e limpa
        if (existingUsers.length > 0) {
            const existingUserId = existingUsers[0]['.id'];
            console.log(`Utilizador ${userMac} já existe. A remover entrada antiga (ID: ${existingUserId}) para criar uma nova sessão.`);
            await client.write(['/ip/hotspot/user/remove', `=.id=${existingUserId}`]);
        }
        
        // 3. Procura se o utilizador está na lista de "ativos" e remove-o
        // Isto força o MikroTik a reavaliar a ligação e aplicar o novo tempo de sessão
        const findActiveUserCommand = ['/ip/hotspot/active/print', `?user=${userMac}`];
        const activeUsers = await client.write(findActiveUserCommand);

        if (activeUsers.length > 0) {
            const activeUserId = activeUsers[0]['.id'];
            console.log(`A remover sessão ativa (ID: ${activeUserId}) para forçar o novo login.`);
            await client.write(['/ip/hotspot/active/remove', `=.id=${activeUserId}`]);
        }

        // 4. Adiciona o novo utilizador temporário com o perfil de 30 minutos
        console.log(`A adicionar novo utilizador temporário ${userMac} com perfil de 30 minutos.`);
        const addUserCommand = [
            '/ip/hotspot/user/add',
            `=name=${userMac}`,
            `=password=${userMac}`, // A senha pode ser o próprio MAC para simplificar
            `=profile=perfil-30-minutos`,
            `=comment=Autorizado via API em ${new Date().toLocaleString()}`,
        ];
        await client.write(addUserCommand);

        console.log(`MAC ${userMac} autorizado com sucesso no Hotspot com uma sessão de 30 minutos.`);
        return true;
    } catch (err) {
        console.error(`Falha ao autorizar o MAC ${userMac} no MikroTik:`, err);
        throw new Error('Falha na comunicação com o servidor de rede.');
    } finally {
        if (client.connected) {
            client.close();
            console.log('Conexão com o MikroTik fechada.');
        }
    }
};

// A função 'removeUserFromHotspot' já não é necessária, pois o MikroTik gere o timeout automaticamente.
module.exports = {
    authorizeUserInHotspot,
};

