
const mineflayer = require('mineflayer');

const CONFIG = {
    host: 'LOSREALES-Najq.aternos.me',
    port: 13241,
    username: 'M14_K4l1fh4',
    auth: 'offline'
};

let reconnectTimer = null;
let reconnectDelay = 25000;

function createBot() {
    console.log('[NPC] Intentando conectar con Aternos...');

    const bot = mineflayer.createBot(CONFIG);

    let routine = null;
    let busy = false;
    let disconnected = false;

    bot.on('login', () => {
        console.log('[NPC] ¡Conexión establecida!');
        reconnectDelay = 25000;
    });

    bot.on('spawn', () => {
        console.log('[NPC] ¡NPC entrando correctamente al mundo!');

        if (routine) clearInterval(routine);

        routine = setInterval(async () => {
            if (!bot.entity || busy || disconnected) return;

            busy = true;

            try {
                const chestBlock = bot.findBlock({
                    matching: block =>
                        block.name === 'chest' ||
                        block.name === 'trapped_chest',
                    maxDistance: 5
                });

                if (chestBlock) {
                    console.log('[NPC] Cofre encontrado.');

                    const chest = await bot.openChest(chestBlock);

                    console.log('[NPC] Cofre abierto.');

                    await new Promise(resolve =>
                        setTimeout(resolve, 2000)
                    );

                    chest.close();

                    console.log('[NPC] Cofre cerrado.');
                } else {
                    console.log('[NPC] No hay cofres cerca.');
                }

                if (!disconnected && bot.entity) {
                    bot.setControlState('jump', true);

                    await new Promise(resolve =>
                        setTimeout(resolve, 500)
                    );

                    bot.setControlState('jump', false);

                    console.log('[NPC] Salto anti-AFK completado.');
                }

            } catch (error) {
                console.log('[NPC] Error en rutina:', error.message);
            } finally {
                bot.setControlState('jump', false);
                busy = false;
            }

        }, 45000);
    });

    bot.on('kicked', (reason) => {
        console.log('[NPC] Expulsado por el servidor:', reason);
    });

    bot.on('error', (error) => {
        console.log('[NPC] Error de conexión:', error.message);
    });

    bot.on('end', (reason) => {
        disconnected = true;

        if (routine) {
            clearInterval(routine);
            routine = null;
        }

        console.log('[NPC] Desconectado:', reason);

        if (reconnectTimer) return;

        console.log(`[NPC] Reconectando en ${reconnectDelay / 1000} segundos...`);

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            createBot();
        }, reconnectDelay);

        reconnectDelay = Math.min(reconnectDelay * 2, 120000);
    });
}

createBot();
                  
