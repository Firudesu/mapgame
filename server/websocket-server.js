import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = 8080;
const MAX_PLAYERS = 8;

const server = http.createServer();
const wss = new WebSocketServer({ server });

const players = {};

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send current players to new connection
    ws.send(JSON.stringify({
        type: 'players',
        data: players
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'getPlayers':
                    ws.send(JSON.stringify({
                        type: 'players',
                        data: players
                    }));
                    break;

                case 'join':
                    if (Object.keys(players).length >= MAX_PLAYERS) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Maximum players reached'
                        }));
                        return;
                    }

                    const playerData = data.data;
                    players[playerData.walletID] = {
                        walletID: playerData.walletID,
                        x: playerData.x,
                        y: playerData.y,
                        color: playerData.color,
                        stamina: playerData.stamina || 100,
                        inventory: playerData.inventory || []
                    };

                    // Broadcast to all clients
                    broadcast({
                        type: 'playerJoined',
                        data: players[playerData.walletID]
                    }, ws);

                    console.log(`Player joined: ${playerData.walletID}`);
                    break;

                case 'update':
                    if (players[data.data.walletID]) {
                        players[data.data.walletID] = {
                            ...players[data.data.walletID],
                            ...data.data
                        };

                        // Broadcast to all clients
                        broadcast({
                            type: 'playerUpdated',
                            data: players[data.data.walletID]
                        }, ws);
                    }
                    break;

                case 'leave':
                    if (players[data.data.walletID]) {
                        delete players[data.data.walletID];
                        broadcast({
                            type: 'playerLeft',
                            data: data.data
                        }, ws);
                        console.log(`Player left: ${data.data.walletID}`);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function broadcast(message, excludeWs = null) {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

