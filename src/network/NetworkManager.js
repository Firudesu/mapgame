import { createClient } from '@supabase/supabase-js';

export class NetworkManager {
    constructor() {
        this.supabase = null;
        this.wsConnection = null;
        this.useSupabase = false;
        this.useWebSocket = false;
        this.players = {};
        this.onPlayerUpdate = null;
        this.onPlayerJoined = null;

        this.init();
    }

    async init() {
        // Try to connect to Supabase first
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            try {
                this.supabase = createClient(supabaseUrl, supabaseKey);
                await this.setupSupabase();
                this.useSupabase = true;
                console.log('✅ Connected to Supabase Realtime');
            } catch (error) {
                console.warn('Supabase connection failed, falling back to WebSocket:', error);
                this.setupWebSocket();
            }
        } else {
            console.log('No Supabase credentials found, using WebSocket fallback');
            this.setupWebSocket();
        }
    }

    async setupSupabase() {
        // Create players table subscription
        const channel = this.supabase
            .channel('players')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'players'
                },
                (payload) => {
                    this.handleSupabaseUpdate(payload);
                }
            )
            .subscribe();

        // Load initial players
        const { data, error } = await this.supabase
            .from('players')
            .select('*');

        if (error) {
            console.error('Error loading players:', error);
        } else if (data) {
            data.forEach(player => {
                this.players[player.walletID] = {
                    walletID: player.walletID,
                    x: player.x,
                    y: player.y,
                    color: player.color,
                    stamina: player.stamina || 100,
                    inventory: player.inventory || []
                };
            });
            if (this.onPlayerUpdate) {
                this.onPlayerUpdate(this.players);
            }
        }
    }

    handleSupabaseUpdate(payload) {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const player = payload.new;
            this.players[player.walletID] = {
                walletID: player.walletID,
                x: player.x,
                y: player.y,
                color: player.color,
                stamina: player.stamina || 100,
                inventory: player.inventory || []
            };
        } else if (payload.eventType === 'DELETE') {
            delete this.players[payload.old.walletID];
        }

        if (this.onPlayerUpdate) {
            this.onPlayerUpdate(this.players);
        }
    }


    setupWebSocket() {
        // Try to connect to local WebSocket server
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
        
        try {
            this.wsConnection = new WebSocket(wsUrl);
            
            this.wsConnection.onopen = () => {
                console.log('Connected to WebSocket server');
                this.useWebSocket = true;
                // Request current players
                this.wsConnection.send(JSON.stringify({ type: 'getPlayers' }));
            };

            this.wsConnection.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Fallback to local-only mode
                console.log('Running in local-only mode (no multiplayer sync)');
            };

            this.wsConnection.onclose = () => {
                console.log('WebSocket connection closed');
                this.useWebSocket = false;
            };
        } catch (error) {
            console.warn('WebSocket connection failed, running in local-only mode:', error);
        }
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'players':
                this.players = message.data;
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(this.players);
                }
                break;
            case 'playerJoined':
                this.players[message.data.walletID] = message.data;
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(this.players);
                }
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(message.data);
                }
                break;
            case 'playerUpdated':
                this.players[message.data.walletID] = message.data;
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(this.players);
                }
                break;
            case 'playerLeft':
                delete this.players[message.data.walletID];
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(this.players);
                }
                break;
        }
    }

    async joinGame(playerData) {
        // Limit to 8 players
        if (Object.keys(this.players).length >= 8) {
            console.warn('Maximum players reached (8)');
            return;
        }

        if (this.useSupabase) {
            const { error } = await this.supabase
                .from('players')
                .upsert({
                    walletID: playerData.walletID,
                    x: playerData.x,
                    y: playerData.y,
                    color: playerData.color,
                    stamina: playerData.stamina,
                    inventory: playerData.inventory
                }, {
                    onConflict: 'walletID'
                });

            if (error) {
                console.error('Error joining game:', error);
            }
        } else if (this.useWebSocket && this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'join',
                data: playerData
            }));
        } else {
            // Local-only mode - just add to local players
            this.players[playerData.walletID] = playerData;
            if (this.onPlayerUpdate) {
                this.onPlayerUpdate(this.players);
            }
            if (this.onPlayerJoined) {
                this.onPlayerJoined(playerData);
            }
        }
    }

    updatePlayer(playerData) {
        if (this.useSupabase) {
            this.supabase
                .from('players')
                .update({
                    x: playerData.x,
                    y: playerData.y,
                    stamina: playerData.stamina
                })
                .eq('walletID', playerData.walletID);
        } else if (this.useWebSocket && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'update',
                data: playerData
            }));
        }
    }

    leaveGame(walletID) {
        if (this.useSupabase) {
            this.supabase
                .from('players')
                .delete()
                .eq('walletID', walletID);
        } else if (this.useWebSocket && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'leave',
                data: { walletID }
            }));
        }
    }
}

